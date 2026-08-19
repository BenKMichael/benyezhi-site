import express from 'express';
import session from 'express-session';

const app = express()

app.set('trust proxy', true);
app.use(session({
    secret: 'tingtangwallawallabingbang',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.get('/hello-html', (req, res) => {
    const now = new Date().toString();
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <title>Hello World</title>
        </head>
        <body>
            <h1 align=center>Hello Node.js(express) World</h1>
            <hr/>
            <p>Hello World</p>
            <p>This page was generated with Node.js(express)</p>
            <p>This program was generated at: ${now}</p>
            <p>Your current IP Address is: ${req.ip}</p>
        </body>
        </html>
    `);
});

app.get('/hello-json', (req, res) => {
    const now = new Date().toString();
    res.json({ 
        title: 'Hello Node.js(express)!',
        message: 'This page was generated with Node.js(express)',
        IP: req.ip, 
        time: now,
        heading: 'Hello, Node.js(express)!',  
    });
});

app.get('/env', (req, res) => {
    const data = { 
        QUERY_STRING: JSON.stringify(req.query),
        REMOTE_ADDR: req.ip, 
        REQUEST_METHOD: req.method, 
        REQUEST_SCHEME: req.protocol, 
        REQUEST_URI: req.originalUrl,
        SERVER_PROTOCOL: `HTTP/${req.httpVersion}`,
        ...req.headers 
    };
    const rows = Object.entries(data)
        .map(([key, value]) => `<b>${key.toUpperCase()}:</b> ${value}<br/>`)
        .join('\n')
    ;
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Environment Variables</title></head>
        <body>
        <h1 align=center>Environment Variables</h1>
        <hr/>
        ${rows}
        </body>
        </html>
    `);
});

app.all('/echo', express.text({ type: '*/*' }), (req, res) => {
    const protocol = `HTTP/${req.protocol.toUpperCase()}`;
    const query = req.url.split('?')[1] || '';

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>Node.js(express) Echo</title></head>
        <body>
        <h1 align=center>Node.js(express) Echo</h1>
        <hr/>
        <p><b>HTTP Method:</b> ${protocol}</p>
        <p><b>Query String:</b> ${query}</p>
        <p><b>Message Body:</b> ${req.body || ''}</p>
        </body>
        </html>
    `);
});

app.get('/session', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head><title>State Demo - Page 1 (Collect Data)</title></head>
        <body>
        <h1>Server-Side State Demo (Node.js(express)) - Page 1: Input</h1>
        <hr>
        <p><b>Session ID:</b> ${req.session.id}</p>
        <form action="session" method="POST">
            <p>
            <label for="username">Enter some data to save to server session:</label><br>
            <input type="text" id="username" name="username" value="${req.session.username || ''}" required>
            </p>
            <p>
            <button type="submit">Save and Check Session</button>
            </p>
        </form>
        <p>
            <a href="session">Edit Session</a> |
            <a href="session-check">Check Session</a> | 
            <a href="session-clear">Clear Session</a>
        </p>
        </body>
        </html>
    `);
});

app.post('/session', express.urlencoded({ extended: true }), (req, res) => {
    req.session.username = req.body.username;
    res.redirect('session-check');
});

app.get('/session-check', (req, res) => {
    const dataDisplay = req.session.username
        ? `<strong>${req.session.username}</strong>`
        : `<em>No data currently saved in session.</em>`;

    res.send(` 
        <!DOCTYPE html>
        <html lang="en">
        <head><title>State Demo - Page 2 (View Data)</title></head>
        <body>
        <h1>Server-Side State Demo (Node.js(express)) - Page 2: View</h1>
        <hr>
        <p><b>Session ID:</b> ${req.session.id}</p>
        <p><b>Saved Session Data:</b> ${dataDisplay}</p>
        <hr>
        <p>
            <a href="session">Edit Session</a> |
            <a href="session-check">Check Session</a> | 
            <a href="session-clear">Clear Session</a>
        </p>
        </body>
        </html>
    `);
});

app.get('/session-clear', (req, res) => {
    req.session.destroy((err) => {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head><title>State Demo - Cleared</title></head>
            <body>
            <h1>Session Destroyed</h1>
            <hr>
            <p>Server-side session has been deleted successfully.</p>
            <p>
                <a href="session">Edit Session</a> |
                <a href="session-check">Check Session</a> | 
                <a href="session-clear">Clear Session</a>
            </p>
            </body>
            </html>
        `);
    });
});


app.listen(3000, () => {
    console.log('Node server listening on port 3000');
});

