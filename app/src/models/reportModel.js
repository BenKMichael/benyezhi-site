const pool = require('../db/pool');

async function list() {
  const [rows] = await pool.query(
    `SELECT id, report_type, creator_name, range_start, range_end, created_at
     FROM reports
     ORDER BY created_at DESC, id DESC`
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM reports WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function create({ reportType, createdBy, creatorName, rangeStart, rangeEnd, data }) {
  const [result] = await pool.query(
    `INSERT INTO reports (report_type, created_by, creator_name, range_start, range_end, data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [reportType, createdBy, creatorName, rangeStart, rangeEnd, JSON.stringify(data)]
  );
  return result.insertId;
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
  return result.affectedRows;
}

module.exports = { list, findById, create, remove };
