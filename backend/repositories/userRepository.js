const { pool } = require('../config/db');

const SELECT_PUBLIC = 'id, username, role, created_at';

const userRepository = {
  async findByUsername(username) {
    const [rows] = await pool.query(
      'SELECT id, username, password_hash, role, created_at FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT ${SELECT_PUBLIC} FROM users WHERE id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ username, passwordHash, role = 'warden' }) {
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role]
    );
    return result.insertId;
  },

  async updatePassword(id, passwordHash) {
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result.affectedRows;
  },
};

module.exports = userRepository;
