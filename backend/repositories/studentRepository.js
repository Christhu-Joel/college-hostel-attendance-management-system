const { pool } = require('../config/db');

const studentRepository = {
  async findAll(filters, { offset, size }) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('(s.register_no LIKE ? OR s.name LIKE ? OR s.department LIKE ?)');
      const like = `%${filters.search}%`;
      params.push(like, like, like);
    }
    if (filters.category) {
      where.push('s.category = ?');
      params.push(filters.category);
    }
    if (filters.department) {
      where.push('s.department = ?');
      params.push(filters.department);
    }
    if (filters.study_year) {
      where.push('s.study_year = ?');
      params.push(filters.study_year);
    }
    if (filters.room_id) {
      where.push('s.room_id = ?');
      params.push(filters.room_id);
    }
    if (filters.status) {
      where.push('s.status = ?');
      params.push(filters.status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT s.id, s.register_no, s.name, s.category, s.department, s.study_year,
              s.room_id, r.room_number, s.status, s.created_at, s.updated_at
         FROM students s
         LEFT JOIN rooms r ON r.id = s.room_id
         ${whereSql}
         ORDER BY s.register_no ASC
         LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM students s ${whereSql}`,
      params
    );

    return { rows, total };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT s.id, s.register_no, s.name, s.category, s.department, s.study_year,
              s.room_id, r.room_number, s.status, s.created_at, s.updated_at
         FROM students s
         LEFT JOIN rooms r ON r.id = s.room_id
        WHERE s.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByRegisterNo(registerNo) {
    const [rows] = await pool.query('SELECT * FROM students WHERE register_no = ?', [registerNo]);
    return rows[0] || null;
  },

  async create({ registerNo, name, category, department, studyYear, roomId, status }) {
    const [result] = await pool.query(
      `INSERT INTO students (register_no, name, category, department, study_year, room_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [registerNo, name, category, department, studyYear, roomId ?? null, status ?? 'active']
    );
    return result.insertId;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return 0;
    const sets = keys.map((k) => `${k} = ?`);
    const values = keys.map((k) => fields[k]);
    const [result] = await pool.query(
      `UPDATE students SET ${sets.join(', ')} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM students WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async countByStatus(status) {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM students WHERE status = ?',
      [status]
    );
    return total;
  },

  async distinctDepartments() {
    const [rows] = await pool.query(
      'SELECT DISTINCT department FROM students ORDER BY department ASC'
    );
    return rows.map((r) => r.department);
  },
};

module.exports = studentRepository;
