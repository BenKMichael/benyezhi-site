const session = require('express-session');
const config = require('../config');

module.exports = session({
  name: 'demo_sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: config.cookieSecure }
});
