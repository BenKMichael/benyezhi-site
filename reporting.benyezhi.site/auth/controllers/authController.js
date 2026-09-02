const bcrypt = require('bcryptjs');
const db = require('../db');
const { SESSION_COOKIE_NAME } = require('../config/constants');

exports.getHome = (req, res) => {
    res.render('home', { user: req.session.user });
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

        return res.redirect('/');
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