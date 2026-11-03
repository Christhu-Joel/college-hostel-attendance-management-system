const { pool } = require('../config/db');

const chartRepository = {
  async monthlyTrend(months = 12, academicYearId) {
    const yearCond = academicYearId ? 'AND a.academic_year_id = ?' : '';
    const params = academicYearId ? [academicYearId] : [];
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(a.attendance_date, '%Y-%m') AS month,
              COUNT(a.id) AS total,
              COALESCE(SUM(a.status = 'present'), 0) AS present,
              COALESCE(SUM(a.status = 'absent'), 0) AS absent
         FROM attendance a
        WHERE a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
          ${yearCond}
        GROUP BY DATE_FORMAT(a.attendance_date, '%Y-%m')
        ORDER BY month ASC`,
      [months - 1, ...params]
    );
    return rows.map((r) => ({
      month: r.month,
      total: Number(r.total),
      present: Number(r.present),
      absent: Number(r.absent),
    }));
  },

  async roomOccupancy() {
    const [rows] = await pool.query(
      `SELECT id, room_number, capacity, current_strength AS occupied,
              (CAST(capacity AS SIGNED) - CAST(current_strength AS SIGNED)) AS available
         FROM rooms
        ORDER BY room_number ASC`
    );
    return rows;
  },

  async hallWise(academicYearId) {
    const yearCond = academicYearId ? 'AND a.academic_year_id = ?' : '';
    const params = academicYearId ? [academicYearId] : [];
    const [rows] = await pool.query(
      `SELECT SUBSTRING_INDEX(r.room_number, '-', 1) AS hall,
              COUNT(a.id) AS total,
              COALESCE(SUM(a.status = 'present'), 0) AS present,
              COALESCE(SUM(a.status = 'absent'), 0) AS absent,
              ROUND(COALESCE(SUM(a.status = 'present'), 0) * 100.0 /
                NULLIF(COUNT(a.id), 0), 1) AS rate
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         JOIN rooms r ON r.id = s.room_id
        WHERE 1=1 ${yearCond}
        GROUP BY hall
        ORDER BY hall ASC`,
      params
    );
    return rows;
  },

  async attendancePercentagePerStudent(academicYearId, limit = 15) {
    const yearCond = academicYearId ? 'AND a.academic_year_id = ?' : '';
    const params = academicYearId ? [academicYearId] : [];
    const [rows] = await pool.query(
      `SELECT s.id, s.register_no, s.name, s.department,
              COUNT(a.id) AS total_days,
              COALESCE(SUM(a.status = 'present'), 0) AS present_days,
              ROUND(COALESCE(SUM(a.status = 'present'), 0) * 100.0 /
                NULLIF(COUNT(a.id), 0), 1) AS percentage
         FROM students s
         JOIN attendance a ON a.student_id = s.id AND a.status IN ('present','absent')
        WHERE s.status = 'active' ${yearCond}
        GROUP BY s.id, s.register_no, s.name, s.department
        ORDER BY percentage ASC
        LIMIT ?`,
      [...params, limit]
    );
    return rows;
  },
};

module.exports = chartRepository;
