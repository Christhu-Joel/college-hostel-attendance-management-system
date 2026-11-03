const { pool } = require('../config/db');

const attendanceRepository = {
  async findByStudentAndDate(studentId, date) {
    const [rows] = await pool.query(
      'SELECT * FROM attendance WHERE student_id = ? AND attendance_date = ?',
      [studentId, date]
    );
    return rows[0] || null;
  },

  async create({ studentId, date, status, academicYearId }) {
    const [result] = await pool.query(
      `INSERT INTO attendance (student_id, attendance_date, status, academic_year_id)
       VALUES (?, ?, ?, ?)`,
      [studentId, date, status, academicYearId ?? null]
    );
    return result.insertId;
  },

  async updateStatus(id, status) {
    const [result] = await pool.query(
      'UPDATE attendance SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  async upsertMany(rows) {
    if (!rows.length) return 0;
    const values = rows.map((r) => [r.studentId, r.date, r.status, r.academicYearId ?? null]);
    const placeholders = rows.map(() => '(?, ?, ?, ?)').join(', ');
    const params = values.flat();
    const [result] = await pool.query(
      `INSERT INTO attendance (student_id, attendance_date, status, academic_year_id)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE status = VALUES(status), academic_year_id = VALUES(academic_year_id)`,
      params
    );
    return result.affectedRows;
  },

  async findByDate(date, { includeStudents = true, offset = 0, size = 50 } = {}) {
    const select = includeStudents
      ? `SELECT a.id, a.student_id, a.attendance_date, a.status, a.academic_year_id,
                s.register_no, s.name, s.category, s.department, s.study_year,
                r.room_number
           FROM attendance a
           JOIN students s ON s.id = a.student_id
           LEFT JOIN rooms r ON r.id = s.room_id
          WHERE a.attendance_date = ?
          ORDER BY s.register_no ASC`
      : `SELECT * FROM attendance WHERE attendance_date = ? ORDER BY id ASC`;
    const [rows] = await pool.query(`${select} LIMIT ? OFFSET ?`, includeStudents
      ? [date, size, offset]
      : [date, size, offset]);
    return rows;
  },

  async countForDate(date) {
    const [rows] = await pool.query(
      `SELECT a.status, COUNT(*) AS total
         FROM attendance a
        WHERE a.attendance_date = ?
        GROUP BY a.status`,
      [date]
    );
    const counts = { present: 0, absent: 0, total: 0 };
    for (const r of rows) {
      counts[r.status] = r.total;
      counts.total += r.total;
    }
    return counts;
  },

  // Full daily attendance sheet: every ACTIVE student (with room number)
  // LEFT JOINed to that day's attendance. Students with no record that day
  // still appear (attendance_id NULL). This is the single source for the
  // "mark attendance" screen so student details never need to be re-entered.
  async getFullForDate(date) {
    const [rows] = await pool.query(
      `SELECT s.id AS student_id, s.name, s.register_no, s.category, s.department,
              s.study_year, r.room_number, s.status AS student_status,
              a.id AS attendance_id, a.attendance_date, a.status AS attendance_status,
              a.academic_year_id
         FROM students s
         LEFT JOIN rooms r ON r.id = s.room_id
         LEFT JOIN attendance a
                ON s.id = a.student_id AND a.attendance_date = ?
        WHERE s.status = 'active'
        ORDER BY r.room_number, s.name`,
      [date]
    );
    return rows;
  },

  async history(filters, { offset, size }) {
    const where = [];
    const params = [];

    if (filters.student_id) {
      where.push('a.student_id = ?');
      params.push(filters.student_id);
    }
    if (filters.room_id) {
      where.push('s.room_id = ?');
      params.push(filters.room_id);
    }
    if (filters.date) {
      where.push('a.attendance_date = ?');
      params.push(filters.date);
    }
    if (filters.from) {
      where.push('a.attendance_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('a.attendance_date <= ?');
      params.push(filters.to);
    }
    if (filters.status) {
      where.push('a.status = ?');
      params.push(filters.status);
    }
    if (filters.academic_year_id) {
      where.push('a.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }
    if (filters.search) {
      where.push('(s.register_no LIKE ? OR s.name LIKE ?)');
      const like = `%${filters.search}%`;
      params.push(like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT a.id, a.student_id, a.attendance_date, a.status, a.marked_at,
              s.register_no, s.name, s.category, s.department, s.study_year,
              r.room_number, ay.year_name
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN rooms r ON r.id = s.room_id
         LEFT JOIN academic_years ay ON ay.id = a.academic_year_id
         ${whereSql}
         ORDER BY a.attendance_date DESC, s.register_no ASC
         LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         ${whereSql}`,
      params
    );

    return { rows, total };
  },
};

module.exports = attendanceRepository;
