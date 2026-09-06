const cookieSession = require('cookie-session');
const config = require('../config');
const { SESSION_COOKIE_NAME } = require('../config/constants');

module.exports = cookieSession({
  name: SESSION_COOKIE_NAME,
  secret: config.sessionSecret,
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000
});
