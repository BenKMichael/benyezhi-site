require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { SESSION_COOKIE_NAME } = require('./config/constants');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // set ture for https
        maxAge: 24 * 60 * 60 * 1000 //One day
    }
}));

app.use('/', authRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});