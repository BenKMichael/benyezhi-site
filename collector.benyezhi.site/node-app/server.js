require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise')
const geoip = require('geoip-lite');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy: Needed to retain user IP address for database writes
app.set('trust proxy', 1);
// Enable Express JSON parsing of text
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 2000
};

const pool = mysql.createPool(dbConfig);

// CORS headers
const allowedOrigins = [
	'https://benyezhi.site',
	'https://test.benyezhi.site'
];

app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
	res.header('Access-Control-Allow-Origin', origin);
	res.header('Access-Control-Allow-Credentials', 'true');
    }

    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Parse and write data to MySQL database
app.post('/log', async (req, res) => {
    const payload = req.body;

    // Validate payload contains minimum fields
    if (!payload || !payload.url || !payload.type) {
        return res.status(400).json({ error: 'Missing required fields: url, type' });
    }

    // Convert to DATETIME format for MySQL
    const clientTimestamp = new Date(payload.timestamp)
	.toISOString()
	.slice(0, 19)
	.replace('T', ' ');

    const serverTimestamp = new Date()
	.toISOString()
	.slice(0, 19)
	.replace('T', ' ');

    // Country-level geolocation, only for the once-per-session "static"
    // event -- no need to look it up again for every click/scroll from the
    // same visitor. geoip-lite works off a bundled offline database (no
    // API key, no network call), so this can't fail from an external
    // service being down; it just returns null for IPs it can't resolve
    // (private/reserved ranges, like Docker's internal network locally).
    let data = payload.data || {};
    if (payload.type === 'static') {
        const geo = geoip.lookup(req.ip);
        data = { ...data, country: geo ? geo.country : null };
    }

    try {
        await pool.execute(
            `INSERT INTO events
            (
                session_id,
                type,
                url,
                client_timestamp,
                server_timestamp,
                ip,
                data
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                payload.sessionId || null,
                payload.type,
                payload.url,
                clientTimestamp,
                serverTimestamp,
                req.ip,
                JSON.stringify(data)
            ]
        );
        res.sendStatus(204);
    } catch (err) {
        console.error('Database error:', err);
        res.sendStatus(500);
    }
});

// Fires only for visitors whose browser never ran collector.js (JS off, or
// the script got blocked) -- see the <noscript> pixel on each page. An
// <img> tag can only send a GET with no body, so this can't reuse /log's
// JSON payload; it takes the page URL as a query param and writes a
// minimal "static" event by hand instead.
app.get('/log-noscript', async (req, res) => {
    const url = req.query.url;

    const serverTimestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ');

    if (url) {
        const geo = geoip.lookup(req.ip);
        const data = {
            javascriptAllowed: false,
            // The pixel only loads if images are allowed, so this much we
            // do know for sure -- cookies/CSS can't be inferred without JS,
            // so they're left out rather than guessed.
            imagesAllowed: true,
            userAgent: req.headers['user-agent'] || null,
            language: (req.headers['accept-language'] || '').split(',')[0] || null,
            country: geo ? geo.country : null
        };

        try {
            // events.session_id is NOT NULL, and there's no client-side JS
            // here to generate one via sessionStorage like collector.js
            // does -- a fresh id per hit is fine since there's no way to
            // recognize the same no-JS visitor across page loads anyway.
            const sessionId = 'noscript_' + crypto.randomUUID();
            await pool.execute(
                `INSERT INTO events (session_id, type, url, client_timestamp, server_timestamp, ip, data)
                VALUES (?, 'static', ?, ?, ?, ?, ?)`,
                [sessionId, url, serverTimestamp, serverTimestamp, req.ip, JSON.stringify(data)]
            );
        } catch (err) {
            console.error('Database error (noscript):', err);
        }
    }

    // Always respond with a real 1x1 gif so the <img> never shows a
    // broken-image icon, regardless of whether the insert above worked.
    res.set('Content-Type', 'image/gif');
    res.set('Cache-Control', 'no-store');
    res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
});

app.listen(PORT, () => {
    console.log(`Collector running on port ${PORT}`)
})
