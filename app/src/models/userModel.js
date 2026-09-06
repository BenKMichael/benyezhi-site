const bcrypt = require('bcryptjs');
const pool = require('../db/pool');

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, username, email, role FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByIdentifier(identifier) {
  const [rows] = await pool.query(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ? LIMIT 1',
    [identifier, identifier]
  );
  return rows[0] || null;
}

async function list() {
  const [rows] = await pool.query(
    'SELECT id, username, email, role FROM users ORDER BY username'
  );
  return rows;
}

async function create({ username, email, password, role }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email, passwordHash, role]
  );
  return result.insertId;
}

async function update(id, { username, email, password, role }) {
  if (password) {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET username = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
      [username, email, role, passwordHash, id]
    );
  } else {
    await pool.query(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE id = ?',
      [username, email, role, id]
    );
  }
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows;
}

function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  findById,
  findByIdentifier,
  list,
  create,
  update,
  remove,
  verifyPassword
};
