require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise')
const geoip = require('geoip-lite');

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

app.listen(PORT, () => {
    console.log(`Collector running on port ${PORT}`)
})
