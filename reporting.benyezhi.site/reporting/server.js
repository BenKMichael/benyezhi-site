require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const mysql = require('mysql2/promise');
const { SESSION_COOKIE_NAME } = require('./config/constants');
const { requireAuth, requireAdmin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3002;

// Same reasoning as auth/app.js -- behind Apache, req.secure is always
// false unless we trust the proxy's X-Forwarded-Proto header.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.text({ type: ['text/plain', 'application/x-www-form-urlencoded'] }));

// Same shared sessions table auth writes to -- reporting never creates or
// modifies a session (reporting_user only has SELECT on it), it just reads
// whatever auth already put there. clearExpired is off since auth's own
// store instance already handles pruning expired rows; no need for two
// services independently doing that (and reporting_user couldn't anyway).
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: false,
    clearExpired: false
});

app.use(session({
    store: sessionStore,
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use((req, res, next) => {
    if (typeof req.body === 'string') {
        try {
            req.body = JSON.parse(req.body);
        } catch (e) {
        }
    }
    next();
});

const dbConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT, 10) || 2000
};

const pool = mysql.createPool(dbConfig);

function formatStaticRecord(row) {
    if (!row) return null;
    const parseIfString = (val) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (_) { return val; }
        }
        return val;
    };

    return {
        id: row.id,
        sessionId: row.sessionId,
        userAgent: row.userAgent,
        language: row.language,
        cookiesAllowed: Boolean(row.cookiesAllowed),
        javascriptAllowed: Boolean(row.javascriptAllowed),
        imagesAllowed: Boolean(row.imagesAllowed),
        cssAllowed: Boolean(row.cssAllowed),
        screenDimensions: parseIfString(row.screenDimensions),
        windowDimensions: parseIfString(row.windowDimensions),
        networkConnection: parseIfString(row.networkConnection),
        createdAt: row.createdAt
    };
}

// Reads a "static" event row (collector.js's device/browser fingerprint,
// stored in events.data as JSON) and shapes it like formatStaticRecord.
function formatEventAsStatic(row) {
    if (!row) return null;
    let data = row.data;
    if (typeof data === 'string') {
        try { data = JSON.parse(data); } catch (_) { data = {}; }
    }
    data = data || {};

    return {
        id: row.id,
        sessionId: row.session_id,
        userAgent: data.userAgent,
        language: data.language,
        cookiesAllowed: Boolean(data.cookiesAllowed),
        javascriptAllowed: Boolean(data.javascriptAllowed),
        imagesAllowed: Boolean(data.imagesAllowed),
        cssAllowed: Boolean(data.cssAllowed),
        screenDimensions: data.screenDimensions,
        windowDimensions: data.windowDimensions,
        networkConnection: data.networkConnection,
        createdAt: row.server_timestamp
    };
}

let mockStaticRecords = [
    {
        id: 1,
        sessionId: "sess_mock_001",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        language: "en-US",
        cookiesAllowed: true,
        javascriptAllowed: true,
        imagesAllowed: true,
        cssAllowed: true,
        screenDimensions: { width: 1920, height: 1080 },
        windowDimensions: { innerWidth: 1440, innerHeight: 900 },
        networkConnection: { effectiveType: "4g" },
        createdAt: new Date().toISOString()
    }
];

app.get('/api/static', requireAuth, async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    try {
        const [rows] = await pool.query(
            "SELECT * FROM events WHERE type = 'static' ORDER BY id DESC LIMIT ? OFFSET ?",
            [limit, offset]
        );
        return res.status(200).json({
            status: 'success',
            source: 'database',
            count: rows.length,
            data: rows.map(formatEventAsStatic)
        });
    } catch (err) {
        console.warn('[Fallback Warning] DB query failed, serving mock data:', err.message);
        return res.status(200).json({
            status: 'success',
            source: 'mock_fallback',
            count: mockStaticRecords.length,
            data: mockStaticRecords.map(formatStaticRecord)
        });
    }
});

app.get('/api/static/:identifier', requireAuth, async (req, res) => {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);

    try {
        const sql = isNumeric
            ? "SELECT * FROM events WHERE id = ? AND type = 'static' LIMIT 1"
            : "SELECT * FROM events WHERE session_id = ? AND type = 'static' ORDER BY id DESC LIMIT 1";
        const params = [isNumeric ? parseInt(identifier, 10) : identifier];

        const [rows] = await pool.query(sql, params);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Record not found in DB' });
        }
        return res.status(200).json({
            status: 'success',
            source: 'database',
            data: formatEventAsStatic(rows[0])
        });
    } catch (err) {
        console.warn('[Fallback Warning] DB query failed, serving mock data:', err.message);
        const item = mockStaticRecords.find(r =>
            isNumeric ? r.id === parseInt(identifier, 10) : r.sessionId === identifier
        );
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'Record not found in Mock' });
        }
        return res.status(200).json({
            status: 'success',
            source: 'mock_fallback',
            data: formatStaticRecord(item)
        });
    }
});

app.post('/api/static', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const sessionId = body.sessionId || body.session_id;

    if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
    }

    const staticData = {
        userAgent: body.userAgent || body.user_agent || null,
        language: body.language || null,
        cookiesAllowed: Boolean(body.cookiesAllowed),
        javascriptAllowed: body.javascriptAllowed !== false,
        imagesAllowed: body.imagesAllowed !== false,
        cssAllowed: body.cssAllowed !== false,
        screenDimensions: body.screenDimensions || body.screen_dimensions || null,
        windowDimensions: body.windowDimensions || body.window_dimensions || null,
        networkConnection: body.networkConnection || body.network_connection || null
    };

    try {
        const [result] = await pool.query(
            `INSERT INTO events (session_id, type, url, client_timestamp, server_timestamp, ip, data)
             VALUES (?, 'static', ?, NOW(3), NOW(3), ?, ?)`,
            [sessionId, body.url || null, req.ip, JSON.stringify(staticData)]
        );
        return res.status(201).json({
            status: 'success',
            source: 'database',
            data: { id: result.insertId, sessionId, ...staticData, createdAt: new Date().toISOString() }
        });
    } catch (err) {
        console.warn('[Fallback Warning] DB insert failed, writing to mock array:', err.message);
        const newId = mockStaticRecords.length > 0 ? Math.max(...mockStaticRecords.map(r => r.id)) + 1 : 1;
        const newRecord = { id: newId, sessionId, ...staticData, createdAt: new Date().toISOString() };
        mockStaticRecords.push(newRecord);
        return res.status(201).json({
            status: 'success',
            source: 'mock_fallback',
            data: formatStaticRecord(newRecord)
        });
    }
});

app.delete('/api/static/:id', requireAdmin, async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const [result] = await pool.query("DELETE FROM events WHERE id = ? AND type = 'static'", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Record not found in DB' });
        }
        return res.status(200).json({ status: 'success', source: 'database', message: `Record ${id} deleted` });
    } catch (err) {
        console.warn('[Fallback Warning] DB delete failed, removing from mock array:', err.message);
        const index = mockStaticRecords.findIndex(r => r.id === id);
        if (index === -1) {
            return res.status(404).json({ status: 'error', message: 'Record not found in Mock' });
        }
        const deleted = mockStaticRecords.splice(index, 1);
        return res.status(200).json({ status: 'success', source: 'mock_fallback', message: `Record ${id} deleted`, data: deleted[0] });
    }
});

app.get('/api/events', requireAuth, async (req, res) => {
    const { session_id, type, start_time, end_time } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    let conditions = [];
    let params = [];

    if (session_id) {
        conditions.push('session_id = ?');
        params.push(session_id);
    }
    if (type) {
        conditions.push('type = ?');
        params.push(type);
    }
    if (start_time) {
        conditions.push('server_timestamp >= ?');
        params.push(start_time);
    }
    if (end_time) {
        conditions.push('server_timestamp <= ?');
        params.push(end_time);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM events ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    try {
        const [rows] = await pool.query(sql, params);
        const data = rows.map(r => ({
            id: r.id,
            sessionId: r.session_id,
            type: r.type,
            url: r.url,
            clientTimestamp: r.client_timestamp,
            serverTimestamp: r.server_timestamp,
            ip: r.ip,
            data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        }));

        return res.status(200).json({ status: 'success', count: data.length, data });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/session/:sessionId/timeline', requireAuth, async (req, res) => {
    const { sessionId } = req.params;

    try {
        const [staticRows] = await pool.query(
            "SELECT * FROM events WHERE session_id = ? AND type = 'static' LIMIT 1",
            [sessionId]
        );

        const [eventRows] = await pool.query(
            'SELECT * FROM events WHERE session_id = ? ORDER BY id ASC',
            [sessionId]
        );

        return res.status(200).json({
            status: 'success',
            sessionId: sessionId,
            deviceInfo: staticRows.length > 0 ? formatEventAsStatic(staticRows[0]) : null,
            totalEvents: eventRows.length,
            timeline: eventRows.map(e => ({
                id: e.id,
                type: e.type,
                url: e.url,
                clientTimestamp: e.client_timestamp,
                serverTimestamp: e.server_timestamp,
                data: typeof e.data === 'string' ? JSON.parse(e.data) : e.data
            }))
        });
    } catch (err) {
        return res.status(500).json({ status: 'error', message: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Reporting API running on port ${PORT}`);
});