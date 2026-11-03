const { pool } = require('../config/db');

const reportRepository = {
  async studentReport(filters) {
    const where = ['s.status = ?'];
    const params = ['active'];
    if (filters.student_id) {
      where.push('s.id = ?');
      params.push(filters.student_id);
    }
    if (filters.room_id) {
      where.push('s.room_id = ?');
      params.push(filters.room_id);
    }
    if (filters.department) {
      where.push('s.department = ?');
      params.push(filters.department);
    }
    if (filters.category) {
      where.push('s.category = ?');
      params.push(filters.category);
    }
    const whereSql = where.join(' AND ');

    const [rows] = await pool.query(
      `SELECT s.id, s.register_no, s.name, s.category, s.department, s.study_year,
              r.room_number,
              COUNT(a.id) AS total_days,
              COALESCE(SUM(a.status = 'present'), 0) AS present_days,
              COALESCE(SUM(a.status = 'absent'), 0) AS absent_days,
              ROUND(COALESCE(SUM(a.status = 'present'), 0) * 100.0 /
                NULLIF(COUNT(a.id), 0), 1) AS percentage
         FROM students s
         LEFT JOIN rooms r ON r.id = s.room_id
         LEFT JOIN attendance a
                ON a.student_id = s.id
               AND a.attendance_date BETWEEN COALESCE(?, '0000-01-01') AND COALESCE(?, '9999-12-31')
               ${filters.academic_year_id ? 'AND a.academic_year_id = ?' : ''}
        WHERE ${whereSql}
        GROUP BY s.id, s.register_no, s.name, s.category, s.department, s.study_year, r.room_number
        ORDER BY s.register_no ASC`,
      [
        filters.from || null,
        filters.to || null,
        ...(filters.academic_year_id ? [filters.academic_year_id] : []),
        ...params,
      ]
    );
    return rows;
  },

  async roomReport(filters) {
    const dateWhere = [];
    const params = [];
    if (filters.from) {
      dateWhere.push('a.attendance_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      dateWhere.push('a.attendance_date <= ?');
      params.push(filters.to);
    }
    if (filters.academic_year_id) {
      dateWhere.push('a.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }
    const dateSql = dateWhere.length ? `AND ${dateWhere.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT r.id, r.room_number, r.capacity, r.current_strength,
              COUNT(DISTINCT a.student_id) AS students_recorded,
              COUNT(a.id) AS total_records,
              COALESCE(SUM(a.status = 'present'), 0) AS present_records,
              COALESCE(SUM(a.status = 'absent'), 0) AS absent_records,
              ROUND(COALESCE(SUM(a.status = 'present'), 0) * 100.0 /
                NULLIF(COUNT(a.id), 0), 1) AS attendance_rate
         FROM rooms r
         LEFT JOIN students s ON s.room_id = r.id AND s.status = 'active'
         LEFT JOIN attendance a ON a.student_id = s.id ${dateSql}
        GROUP BY r.id, r.room_number, r.capacity, r.current_strength
        ORDER BY r.room_number ASC`,
      params
    );
    return rows;
  },

  async dailyTotals(filters) {
    const where = [];
    const params = [];
    if (filters.from) {
      where.push('a.attendance_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('a.attendance_date <= ?');
      params.push(filters.to);
    }
    if (filters.academic_year_id) {
      where.push('a.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT a.attendance_date,
              COUNT(DISTINCT a.student_id) AS total_students,
              COALESCE(SUM(a.status = 'present'), 0) AS present,
              COALESCE(SUM(a.status = 'absent'), 0) AS absent,
              ROUND(COALESCE(SUM(a.status = 'present'), 0) * 100.0 /
                NULLIF(COUNT(a.id), 0), 1) AS rate
         FROM attendance a
         ${whereSql}
        GROUP BY a.attendance_date
        ORDER BY a.attendance_date ASC`,
      params
    );
    return rows;
  },

  async presentStudentsByDate(filters) {
    const where = [];
    const params = [];
    if (filters.from) {
      where.push('a.attendance_date >= ?');
      params.push(filters.from);
    }
    if (filters.to) {
      where.push('a.attendance_date <= ?');
      params.push(filters.to);
    }
    if (filters.academic_year_id) {
      where.push('a.academic_year_id = ?');
      params.push(filters.academic_year_id);
    }
    where.push("a.status = 'present'");
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT a.attendance_date AS date,
              s.register_no, s.name, s.category, s.department,
              r.room_number
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN rooms r ON r.id = s.room_id
         ${whereSql}
        ORDER BY a.attendance_date ASC, s.register_no ASC`,
      params
    );
    return rows;
  },
};

module.exports = reportRepository;
