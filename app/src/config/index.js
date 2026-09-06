require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  sessionSecret: required('SESSION_SECRET'),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  db: {
    host: required('DB_HOST'),
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: required('DB_USER'),
    password: process.env.DB_PASSWORD || '',
    database: required('DB_NAME'),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 2000
  },
  corsOrigins: ['https://benyezhi.site', 'https://test.benyezhi.site']
};
