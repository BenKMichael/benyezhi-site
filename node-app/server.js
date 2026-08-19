import express from 'express';
const app = express()
app.set('trust proxy', true);

app.get('/hello-html', (req, res) => {
    const now = new Date().toString();
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Hello World</title>
        </head>
        <body>
            <h1 align=center>Hello Node.js(express) World</h1><hr/>
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
        <html>
        <head><title>Environment Variables</title></head>
        <body>
        <h1 align=center>Environment Variables</h1><hr/>
        ${rows}
        </body>
        </html>
    `);
});

app.all('/echo', (req, res) => {
    const protocol = `HTTP/${req.protocol.toUpperCase()}`;
    const query = req.url.split('?')[1] || '';

    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Node.js(express) Echo</title></head>
        <body>
        <h1 align=center>Node.js(express) Echo</h1><hr/>
        <p><b>HTTP Method:</b> ${protocol}</p>
        <p><b>Query String:</b> ${query}</p>
        <p><b>Message Body:</b> ${req.body}</p>
        </body>
        </html>
    `);
});

app.listen(3000, () => {
    console.log('Node server listening on port 3000');
});

