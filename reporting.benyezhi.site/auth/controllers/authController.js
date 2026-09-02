const bcrypt = require('bcryptjs');
const db = require('../db');
const { SESSION_COOKIE_NAME, ROLES } = require('../config/constants');

exports.getHome = (req, res) => {
    const user = req.session.user;
    res.render('home', { user, isAdmin: user.role === ROLES.ADMIN });
};

exports.getUsers = async (req, res) => {
    const user = req.session.user;
    try {
        const [users] = await db.query('SELECT id, username, email, role FROM users ORDER BY username');
        res.render('users', {
            user,
            isAdmin: user.role === ROLES.ADMIN,
            users,
            ROLES,
            error: req.query.error || null,
            success: req.query.success || null
        });
    } catch (err) {
        console.error('List users error:', err);
        res.render('users', {
            user,
            isAdmin: user.role === ROLES.ADMIN,
            users: [],
            ROLES,
            error: 'Failed to load users.',
            success: null
        });
    }
};

exports.getNewUser = (req, res) => {
    res.render('userForm', {
        user: req.session.user,
        isAdmin: true,
        mode: 'create',
        target: null,
        ROLES,
        error: req.query.error || null
    });
};

exports.createUser = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password || !role) {
        return res.redirect('/users/new?error=' + encodeURIComponent('All fields are required.'));
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [username, email, passwordHash, parseInt(role, 10)]
        );
        return res.redirect('/users?success=' + encodeURIComponent(`User "${username}" created.`));
    } catch (err) {
        console.error('Create user error:', err);
        const message = err.code === 'ER_DUP_ENTRY'
            ? 'That username or email is already taken.'
            : 'Failed to create user.';
        return res.redirect('/users/new?error=' + encodeURIComponent(message));
    }
};

exports.getEditUser = async (req, res) => {
    const targetId = parseInt(req.params.id, 10);
    try {
        const [rows] = await db.query('SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1', [targetId]);
        if (rows.length === 0) {
            return res.redirect('/users?error=' + encodeURIComponent('User not found.'));
        }
        res.render('userForm', {
            user: req.session.user,
            isAdmin: true,
            mode: 'edit',
            target: rows[0],
            ROLES,
            error: req.query.error || null
        });
    } catch (err) {
        console.error('Load user for edit error:', err);
        return res.redirect('/users?error=' + encodeURIComponent('Failed to load user.'));
    }
};

exports.updateUser = async (req, res) => {
    const targetId = parseInt(req.params.id, 10);
    const { username, email, password, role } = req.body;

    if (!username || !email || !role) {
        return res.redirect(`/users/${targetId}/edit?error=` + encodeURIComponent('Username, email, and role are required.'));
    }

    try {
        if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            await db.query(
                'UPDATE users SET username = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
                [username, email, parseInt(role, 10), passwordHash, targetId]
            );
        } else {
            await db.query(
                'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
                [username, email, parseInt(role, 10), targetId]
            );
        }
        return res.redirect('/users?success=' + encodeURIComponent(`User "${username}" updated.`));
    } catch (err) {
        console.error('Update user error:', err);
        const message = err.code === 'ER_DUP_ENTRY'
            ? 'That username or email is already taken.'
            : 'Failed to update user.';
        return res.redirect(`/users/${targetId}/edit?error=` + encodeURIComponent(message));
    }
};

exports.deleteUser = async (req, res) => {
    const targetId = parseInt(req.params.id, 10);

    if (targetId === req.session.user.id) {
        return res.redirect('/users?error=' + encodeURIComponent('You cannot remove your own account.'));
    }

    try {
        // sessions.user_id has ON DELETE CASCADE, so any active sessions
        // belonging to this user are removed automatically along with them.
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [targetId]);
        if (result.affectedRows === 0) {
            return res.redirect('/users?error=' + encodeURIComponent('User not found.'));
        }
        return res.redirect('/users?success=' + encodeURIComponent('User removed.'));
    } catch (err) {
        console.error('Delete user error:', err);
        return res.redirect('/users?error=' + encodeURIComponent('Failed to remove user.'));
    }
};

exports.getLogin = (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/');
    }
    res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.render('login', { error: 'Username/Email and Password are required.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ? LIMIT 1',
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return res.render('login', { error: 'Invalid credentials.' });
        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.render('login', { error: 'Invalid credentials.' });
        }

        req.session.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
        };

        // express-mysql-session only ever writes session_id/expires/data
        // itself -- it has no idea user_id exists. Force the session to
        // actually persist first (req.session.save), then set user_id by
        // hand so the ON DELETE CASCADE on sessions.user_id can do its job
        // later if this user gets removed.
        req.session.save(async (err) => {
            if (err) {
                console.error('Session save error:', err);
                return res.render('login', { error: 'An unexpected error occurred. Please try again.' });
            }
            try {
                await db.query('UPDATE sessions SET user_id = ? WHERE session_id = ?', [user.id, req.sessionID]);
            } catch (linkErr) {
                console.error('Failed to associate session with user:', linkErr);
            }
            return res.redirect('/');
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.render('login', { error: 'An unexpected error occurred. Please try again.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.redirect('/');
        }
        res.clearCookie(SESSION_COOKIE_NAME);
        res.render('logout');
    });
};