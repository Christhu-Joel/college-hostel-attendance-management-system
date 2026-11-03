const { pool } = require('../config/db');

const academicYearRepository = {
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, year_name, is_active, created_at FROM academic_years ORDER BY year_name DESC'
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM academic_years WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByYearName(yearName) {
    const [rows] = await pool.query(
      'SELECT * FROM academic_years WHERE year_name = ?',
      [yearName]
    );
    return rows[0] || null;
  },

  async getActive() {
    const [rows] = await pool.query(
      'SELECT * FROM academic_years WHERE is_active = 1 LIMIT 1'
    );
    return rows[0] || null;
  },

  async create({ yearName }) {
    const [result] = await pool.query(
      'INSERT INTO academic_years (year_name) VALUES (?)',
      [yearName]
    );
    return result.insertId;
  },

  async deactivateAll() {
    await pool.query('UPDATE academic_years SET is_active = 0');
  },

  async activate(id) {
    await this.deactivateAll();
    const [result] = await pool.query(
      'UPDATE academic_years SET is_active = 1 WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  async archive(id) {
    const [result] = await pool.query(
      'UPDATE academic_years SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  async countAttendanceByYear(yearId) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM attendance WHERE academic_year_id = ?',
      [yearId]
    );
    return total;
  },
};

module.exports = academicYearRepository;
