const pool = require('../db/pool');

async function queryStatic({ startTime, endTime, limit, offset }) {
  const conditions = ["type = 'static'"];
  const params = [];
  if (startTime) {
    conditions.push('server_timestamp >= ?');
    params.push(startTime);
  }
  if (endTime) {
    conditions.push('server_timestamp <= ?');
    params.push(endTime);
  }
  params.push(limit, offset);
  const [rows] = await pool.query(
    `SELECT * FROM events WHERE ${conditions.join(' AND ')} ORDER BY id DESC LIMIT ? OFFSET ?`,
    params
  );
  return rows;
}

async function findStatic(identifier) {
  const isNumeric = /^\d+$/.test(identifier);
  const sql = isNumeric
    ? "SELECT * FROM events WHERE id = ? AND type = 'static' LIMIT 1"
    : "SELECT * FROM events WHERE session_id = ? AND type = 'static' ORDER BY id DESC LIMIT 1";
  const value = isNumeric ? parseInt(identifier, 10) : identifier;
  const [rows] = await pool.query(sql, [value]);
  return rows[0] || null;
}

async function insertStatic({ sessionId, url, ip, data }) {
  const [result] = await pool.query(
    `INSERT INTO events (session_id, type, url, client_timestamp, server_timestamp, ip, data)
     VALUES (?, 'static', ?, NOW(3), NOW(3), ?, ?)`,
    [sessionId, url, ip, JSON.stringify(data)]
  );
  return result.insertId;
}

async function deleteStatic(id) {
  const [result] = await pool.query(
    "DELETE FROM events WHERE id = ? AND type = 'static'",
    [id]
  );
  return result.affectedRows;
}

async function queryEvents({ sessionId, type, startTime, endTime, limit, offset }) {
  const conditions = [];
  const params = [];
  if (sessionId) {
    conditions.push('session_id = ?');
    params.push(sessionId);
  }
  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (startTime) {
    conditions.push('server_timestamp >= ?');
    params.push(startTime);
  }
  if (endTime) {
    conditions.push('server_timestamp <= ?');
    params.push(endTime);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);
  const [rows] = await pool.query(
    `SELECT * FROM events ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
    params
  );
  return rows;
}

async function sessionTimeline(sessionId) {
  const [staticRows] = await pool.query(
    "SELECT * FROM events WHERE session_id = ? AND type = 'static' LIMIT 1",
    [sessionId]
  );
  const [eventRows] = await pool.query(
    'SELECT * FROM events WHERE session_id = ? ORDER BY id ASC',
    [sessionId]
  );
  return { staticRow: staticRows[0] || null, eventRows };
}

async function insertEvent({ sessionId, type, url, clientTimestamp, serverTimestamp, ip, data }) {
  await pool.execute(
    `INSERT INTO events (session_id, type, url, client_timestamp, server_timestamp, ip, data)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, type, url, clientTimestamp, serverTimestamp, ip, JSON.stringify(data)]
  );
}

module.exports = {
  queryStatic,
  findStatic,
  insertStatic,
  deleteStatic,
  queryEvents,
  sessionTimeline,
  insertEvent
};
