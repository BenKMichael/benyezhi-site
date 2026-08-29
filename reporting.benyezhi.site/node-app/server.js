require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.text({ type: ['text/plain', 'application/x-www-form-urlencoded'] }));

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

app.get('/api/static', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const offset = parseInt(req.query.offset, 10) || 0;

    try {
        const [rows] = await pool.query(
            'SELECT * FROM static_data ORDER BY id DESC LIMIT ? OFFSET ?',
            [limit, offset]
        );
        return res.status(200).json({
            status: 'success',
            source: 'database',
            count: rows.length,
            data: rows.map(formatStaticRecord)
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

app.get('/api/static/:identifier', async (req, res) => {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);

    try {
        const sql = isNumeric
            ? 'SELECT * FROM static_data WHERE id = ? LIMIT 1'
            : 'SELECT * FROM static_data WHERE session_id = ? OR sessionId = ? LIMIT 1';
        const params = isNumeric ? [parseInt(identifier, 10)] : [identifier, identifier];

        const [rows] = await pool.query(sql, params);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Record not found in DB' });
        }
        return res.status(200).json({
            status: 'success',
            source: 'database',
            data: formatStaticRecord(rows[0])
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

app.post('/api/static', async (req, res) => {
    const body = req.body || {};
    const sessionId = body.sessionId || body.session_id;

    if (!sessionId) {
        return res.status(400).json({ status: 'error', message: 'sessionId is required' });
    }

    try {
        const query = `
            INSERT INTO static_data 
            (session_id, user_agent, language, cookies_allowed, javascript_allowed, images_allowed, css_allowed, screen_dimensions, window_dimensions, network_connection, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3))
            ON DUPLICATE KEY UPDATE
            user_agent = VALUES(user_agent),
            screen_dimensions = VALUES(screen_dimensions),
            window_dimensions = VALUES(window_dimensions),
            network_connection = VALUES(network_connection)
        `;

        const stringifyIfNeeded = (v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : (v || null));

        const params = [
            sessionId,
            body.userAgent || body.user_agent || null,
            body.language || null,
            body.cookiesAllowed ? 1 : 0,
            body.javascriptAllowed !== false ? 1 : 0,
            body.imagesAllowed !== false ? 1 : 0,
            body.cssAllowed !== false ? 1 : 0,
            stringifyIfNeeded(body.screenDimensions || body.screen_dimensions),
            stringifyIfNeeded(body.windowDimensions || body.window_dimensions),
            stringifyIfNeeded(body.networkConnection || body.network_connection)
        ];

        const [result] = await pool.query(query, params);
        return res.status(201).json({
            status: 'success',
            source: 'database',
            data: { id: result.insertId, sessionId, ...body }
        });
    } catch (err) {
        console.warn('[Fallback Warning] DB insert failed, writing to mock array:', err.message);
        const newId = mockStaticRecords.length > 0 ? Math.max(...mockStaticRecords.map(r => r.id)) + 1 : 1;
        const newRecord = { id: newId, ...body, sessionId, createdAt: new Date().toISOString() };
        mockStaticRecords.push(newRecord);
        return res.status(201).json({
            status: 'success',
            source: 'mock_fallback',
            data: formatStaticRecord(newRecord)
        });
    }
});

app.delete('/api/static/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const [result] = await pool.query('DELETE FROM static_data WHERE id = ?', [id]);
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

app.get('/api/events', async (req, res) => {
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

app.get('/api/session/:sessionId/timeline', async (req, res) => {
    const { sessionId } = req.params;

    try {
        const [staticRows] = await pool.query(
            'SELECT * FROM static_data WHERE session_id = ? LIMIT 1',
            [sessionId]
        );

        const [eventRows] = await pool.query(
            'SELECT * FROM events WHERE session_id = ? ORDER BY id ASC',
            [sessionId]
        );

        return res.status(200).json({
            status: 'success',
            sessionId: sessionId,
            deviceInfo: staticRows.length > 0 ? formatStaticRecord(staticRows[0]) : null,
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