const userModel = require('../models/userModel');
const { roleExists, canUserAction, assignableRoleOptions } = require('../config/roles');
const { cleanUsername, cleanEmail, cleanPassword } = require('../lib/validate');

const USERNAME_HINT = 'Username must be 3-50 characters: letters, digits, dot, underscore, hyphen.';
const EMAIL_HINT = 'Enter a valid email address.';
const PASSWORD_HINT = 'Password must be 8-200 characters.';

exports.list = async (req, res) => {
  const actor = req.user;
  const users = await userModel.list();
  res.render('users', {
    active: 'users',
    users: users.map((u) => ({
      ...u,
      canEdit: u.id !== actor.id && canUserAction(actor.role, 'edit', u.role),
      canDelete: u.id !== actor.id && canUserAction(actor.role, 'delete', u.role)
    })),
    canCreate: assignableRoleOptions(actor.role).length > 0,
    error: req.query.error || null,
    success: req.query.success || null
  });
};

exports.newForm = (req, res) => {
  const roleOptions = assignableRoleOptions(req.user.role);
  if (roleOptions.length === 0) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot create users.'));
  }
  res.render('userForm', {
    active: 'users',
    mode: 'create',
    target: null,
    roleOptions,
    error: req.query.error || null
  });
};

exports.create = async (req, res) => {
  const { role } = req.body;
  const fail = (message) => res.redirect('/users/new?error=' + encodeURIComponent(message));

  const username = cleanUsername(req.body.username);
  const email = cleanEmail(req.body.email);
  const password = cleanPassword(req.body.password);

  if (!username) return fail(USERNAME_HINT);
  if (!email) return fail(EMAIL_HINT);
  if (!password) return fail(PASSWORD_HINT);
  if (!roleExists(role) || !canUserAction(req.user.role, 'create', role)) {
    return fail('You cannot create a user with that role.');
  }

  try {
    await userModel.create({ username, email, password, role });
    res.redirect('/users?success=' + encodeURIComponent(`User "${username}" created.`));
  } catch (err) {
    const message = err.code === 'ER_DUP_ENTRY'
      ? 'That username or email is already taken.'
      : 'Failed to create user.';
    res.redirect('/users/new?error=' + encodeURIComponent(message));
  }
};

exports.editForm = async (req, res) => {
  const target = await userModel.findById(parseInt(req.params.id, 10));
  if (!target) {
    return res.redirect('/users?error=' + encodeURIComponent('User not found.'));
  }
  if (target.id === req.user.id) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot edit your own account.'));
  }
  if (!canUserAction(req.user.role, 'edit', target.role)) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot edit that user.'));
  }
  res.render('userForm', {
    active: 'users',
    mode: 'edit',
    target,
    roleOptions: assignableRoleOptions(req.user.role),
    error: req.query.error || null
  });
};

exports.update = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { role } = req.body;
  const fail = (message) => res.redirect(`/users/${id}/edit?error=` + encodeURIComponent(message));

  const target = await userModel.findById(id);
  if (!target) {
    return res.redirect('/users?error=' + encodeURIComponent('User not found.'));
  }
  if (target.id === req.user.id) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot edit your own account.'));
  }
  if (!canUserAction(req.user.role, 'edit', target.role)) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot edit that user.'));
  }

  const username = cleanUsername(req.body.username);
  const email = cleanEmail(req.body.email);

  if (!username) return fail(USERNAME_HINT);
  if (!email) return fail(EMAIL_HINT);
  if (!roleExists(role) || !canUserAction(req.user.role, 'edit', role)) {
    return fail('You cannot assign that role.');
  }

  let password;
  if (req.body.password) {
    password = cleanPassword(req.body.password);
    if (!password) return fail(PASSWORD_HINT);
  }

  try {
    await userModel.update(id, { username, email, password, role });
    res.redirect('/users?success=' + encodeURIComponent(`User "${username}" updated.`));
  } catch (err) {
    const message = err.code === 'ER_DUP_ENTRY'
      ? 'That username or email is already taken.'
      : 'Failed to update user.';
    res.redirect(`/users/${id}/edit?error=` + encodeURIComponent(message));
  }
};

exports.remove = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id === req.user.id) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot remove your own account.'));
  }
  const target = await userModel.findById(id);
  if (!target) {
    return res.redirect('/users?error=' + encodeURIComponent('User not found.'));
  }
  if (!canUserAction(req.user.role, 'delete', target.role)) {
    return res.redirect('/users?error=' + encodeURIComponent('You cannot delete that user.'));
  }

  const affected = await userModel.remove(id);
  if (!affected) {
    return res.redirect('/users?error=' + encodeURIComponent('User not found.'));
  }
  res.redirect('/users?success=' + encodeURIComponent('User removed.'));
};
