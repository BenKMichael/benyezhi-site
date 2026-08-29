require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
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
        screenDimensions: JSON.stringify({ width: 1920, height: 1080 }),
        windowDimensions: JSON.stringify({ innerWidth: 1440, innerHeight: 900 }),
        networkConnection: JSON.stringify({ effectiveType: "4g" }),
        createdAt: new Date().toISOString()
    }
];

app.get('/api/static', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM static_data ORDER BY id DESC');
        return res.status(200).json({
            status: 'success',
            source: 'database',
            count: rows.length,
            data: rows
        });
    } catch (err) {
        console.warn('[Fallback Warning] DB query failed, serving mock data:', err.message);
        return res.status(200).json({
            status: 'success',
            source: 'mock_fallback',
            count: mockStaticRecords.length,
            data: mockStaticRecords
        });
    }
});

app.get('/api/static/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    try {
        const [rows] = await pool.query('SELECT * FROM static_data WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Record not found in DB' });
        }
        return res.status(200).json({ status: 'success', source: 'database', data: rows[0] });
    } catch (err) {
        console.warn('[Fallback Warning] DB query failed, serving mock data:', err.message);
        const item = mockStaticRecords.find(r => r.id === id);
        if (!item) {
            return res.status(404).json({ status: 'error', message: 'Record not found in Mock' });
        }
        return res.status(200).json({ status: 'success', source: 'mock_fallback', data: item });
    }
});

app.post('/api/static', async (req, res) => {
    const body = req.body;
    try {
        const query = `
      INSERT INTO static_data 
      (sessionId, userAgent, language, cookiesAllowed, javascriptAllowed, imagesAllowed, cssAllowed, screenDimensions, windowDimensions, networkConnection, createdAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
        const params = [
            body.sessionId || null,
            body.userAgent || null,
            body.language || null,
            body.cookiesAllowed ? 1 : 0,
            body.javascriptAllowed ? 1 : 0,
            body.imagesAllowed ? 1 : 0,
            body.cssAllowed ? 1 : 0,
            typeof body.screenDimensions === 'object' ? JSON.stringify(body.screenDimensions) : body.screenDimensions,
            typeof body.windowDimensions === 'object' ? JSON.stringify(body.windowDimensions) : body.windowDimensions,
            typeof body.networkConnection === 'object' ? JSON.stringify(body.networkConnection) : body.networkConnection
        ];

        const [result] = await pool.query(query, params);
        return res.status(201).json({
            status: 'success',
            source: 'database',
            data: { id: result.insertId, ...body }
        });
    } catch (err) {
        console.warn('[Fallback Warning] DB insert failed, writing to mock array:', err.message);
        const newId = mockStaticRecords.length > 0 ? Math.max(...mockStaticRecords.map(r => r.id)) + 1 : 1;
        const newRecord = { id: newId, ...body, createdAt: new Date().toISOString() };
        mockStaticRecords.push(newRecord);
        return res.status(201).json({
            status: 'success',
            source: 'mock_fallback',
            data: newRecord
        });
    }
});

app.put('/api/static/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const body = req.body;
    try {
        const query = `
      UPDATE static_data SET 
      sessionId = COALESCE(?, sessionId),
      userAgent = COALESCE(?, userAgent),
      language = COALESCE(?, language)
      WHERE id = ?
    `;
        const [result] = await pool.query(query, [body.sessionId || null, body.userAgent || null, body.language || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Record not found in DB' });
        }
        return res.status(200).json({ status: 'success', source: 'database', message: `Record ${id} updated` });
    } catch (err) {
        console.warn('[Fallback Warning] DB update failed, updating mock array:', err.message);
        const index = mockStaticRecords.findIndex(r => r.id === id);
        if (index === -1) {
            return res.status(404).json({ status: 'error', message: 'Record not found in Mock' });
        }
        mockStaticRecords[index] = { ...mockStaticRecords[index], ...body, id };
        return res.status(200).json({ status: 'success', source: 'mock_fallback', data: mockStaticRecords[index] });
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

app.listen(PORT, () => {
    console.log(`Reporting API running on port ${PORT}`);
});