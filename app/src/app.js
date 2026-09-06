const path = require('path');
const express = require('express');
const jsonForHtml = require('./lib/jsonForHtml');
const sessionMiddleware = require('./middleware/session');
const { loadUser } = require('./middleware/auth');
const demoRoutes = require('./routes/demoRoutes');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.jsonForHtml = jsonForHtml;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/node', demoRoutes);

app.use(sessionMiddleware);
app.use(loadUser);
app.use('/', routes);

app.use(errorHandler);

module.exports = app;
