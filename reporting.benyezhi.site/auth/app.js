require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const { SESSION_COOKIE_NAME } = require('./config/constants');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Shared session store (the `sessions` table in analytics_db) -- this is
// what lets reporting recognize a session auth created, since they're
// separate processes with no shared memory otherwise. createDatabaseTable
// is off because the table is predefined in database/init/03_sessions.sql,
// not auto-created at runtime (auth_user has no CREATE privilege).
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: false
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    store: sessionStore,
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: 24 * 60 * 60 * 1000 //One day
    }
}));

app.use('/', authRoutes);
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});