const userModel = require('../models/userModel');
const { SESSION_COOKIE_NAME } = require('../config/constants');

exports.getLogin = (req, res) => {
  if (req.user) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
};

exports.postLogin = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.render('login', { error: 'Username/Email and Password are required.' });
  }

  const user = await userModel.findByIdentifier(identifier);
  if (!user) {
    return res.render('login', { error: 'Invalid credentials.' });
  }

  const match = await userModel.verifyPassword(password, user.password_hash);
  if (!match) {
    return res.render('login', { error: 'Invalid credentials.' });
  }

  req.session.userId = user.id;
  res.redirect('/');
};

exports.logout = (req, res) => {
  req.session = null;
  res.clearCookie(SESSION_COOKIE_NAME);
  res.render('logout');
};
