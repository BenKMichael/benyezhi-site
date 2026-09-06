exports.helloHtml = (req, res) => {
  const now = new Date().toString();
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><title>Hello World</title></head>
<body>
<h1 align=center>Hello Node.js(express) World</h1>
<hr/>
<p>Hello World</p>
<p>This page was generated with Node.js(express)</p>
<p>This program was generated at: ${now}</p>
<p>Your current IP Address is: ${req.ip}</p>
</body>
</html>`);
};

exports.helloJson = (req, res) => {
  res.json({
    title: 'Hello Node.js(express)!',
    message: 'This page was generated with Node.js(express)',
    IP: req.ip,
    time: new Date().toString(),
    heading: 'Hello, Node.js(express)!'
  });
};

exports.env = (req, res) => {
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
    .join('\n');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><title>Environment Variables</title></head>
<body>
<h1 align=center>Environment Variables</h1>
<hr/>
${rows}
</body>
</html>`);
};

exports.echo = (req, res) => {
  const protocol = `HTTP/${req.protocol.toUpperCase()}`;
  const query = req.url.split('?')[1] || '';
  const now = new Date().toString();
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><title>Node.js(express) Echo</title></head>
<body>
<h1 align=center>Node.js(express) Echo</h1>
<hr/>
<p><b>HTTP Method:</b> ${protocol}</p>
<p><b>Query String:</b> ${query}</p>
<p><b>Message Body:</b> ${req.body || ''}</p>
<p><b>Hostname:</b> ${req.hostname}</p>
<p><b>Date/Time:</b> ${now}</p>
<p><b>User Agent:</b> ${req.headers['user-agent']}</p>
<p><b>IP Address:</b> ${req.ip}</p>
</body>
</html>`);
};

exports.sessionForm = (req, res) => {
  res.send(`<!DOCTYPE html>
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
<p><button type="submit">Save and Check Session</button></p>
</form>
<p>
<a href="session">Edit Session</a> |
<a href="session-check">Check Session</a> |
<a href="session-clear">Clear Session</a>
</p>
</body>
</html>`);
};

exports.sessionSave = (req, res) => {
  req.session.username = req.body.username;
  res.redirect('session-check');
};

exports.sessionCheck = (req, res) => {
  const dataDisplay = req.session.username
    ? `<strong>${req.session.username}</strong>`
    : `<em>No data currently saved in session.</em>`;
  res.send(`<!DOCTYPE html>
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
</html>`);
};

exports.sessionClear = (req, res) => {
  req.session.destroy(() => {
    res.send(`<!DOCTYPE html>
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
</html>`);
  });
};
