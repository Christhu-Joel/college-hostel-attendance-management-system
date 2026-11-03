const { pool } = require('../config/db');

const dashboardRepository = {
  async stats() {
    const [[{ totalStudents, activeStudents, inactiveStudents }]] = await pool.query(
      `SELECT COUNT(*) AS totalStudents,
              SUM(status = 'active') AS activeStudents,
              SUM(status = 'inactive') AS inactiveStudents
         FROM students`
    );
    return { totalStudents, activeStudents, inactiveStudents };
  },

  async todayAttendance() {
    const [rows] = await pool.query(
      `SELECT a.status, COUNT(*) AS total
         FROM attendance a
        WHERE a.attendance_date = CURDATE()
        GROUP BY a.status`
    );
    const counts = { present: 0, absent: 0, notMarked: 0, totalMarked: 0 };
    for (const r of rows) {
      counts[r.status] = r.total;
      counts.totalMarked += r.total;
    }
    return counts;
  },

  async roomSummary() {
    const [[summary]] = await pool.query(
      `SELECT COUNT(*) AS totalRooms,
              COALESCE(SUM(capacity), 0) AS totalCapacity,
              COALESCE(SUM(current_strength), 0) AS occupied
         FROM rooms`
    );
    const total = summary.totalRooms || 0;
    const capacity = summary.totalCapacity || 0;
    const occupied = summary.occupied || 0;
    return {
      totalRooms: total,
      totalCapacity: capacity,
      occupied,
      availableBeds: capacity - occupied,
      occupancyRate: capacity ? Math.round((occupied / capacity) * 100) : 0,
    };
  },

  async recentActivity(limit = 10) {
    const [rows] = await pool.query(
      `SELECT a.id, a.student_id, a.attendance_date, a.status, a.marked_at,
              s.register_no, s.name, r.room_number
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN rooms r ON r.id = s.room_id
        ORDER BY a.marked_at DESC
        LIMIT ?`,
      [limit]
    );
    return rows;
  },

  async dailyTrend(days = 14) {
    const [rows] = await pool.query(
      `SELECT a.attendance_date,
              SUM(a.status = 'present') AS present,
              SUM(a.status = 'absent') AS absent
         FROM attendance a
        WHERE a.attendance_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY a.attendance_date
        ORDER BY a.attendance_date ASC`,
      [days - 1]
    );
    return rows.map((r) => ({
      date: r.attendance_date,
      present: Number(r.present || 0),
      absent: Number(r.absent || 0),
    }));
  },

  async presentVsAbsent() {
    const [[{ present, absent }]] = await pool.query(
      `SELECT COALESCE(SUM(status = 'present'), 0) AS present,
              COALESCE(SUM(status = 'absent'), 0) AS absent
         FROM attendance`
    );
    return { present, absent };
  },

  async frequentlyAbsent(limit = 8) {
    const [rows] = await pool.query(
      `SELECT s.id, s.register_no, s.name, s.department, r.room_number,
              COUNT(*) AS total_days,
              SUM(a.status = 'absent') AS absent_days
         FROM attendance a
         JOIN students s ON s.id = a.student_id
         LEFT JOIN rooms r ON r.id = s.room_id
        GROUP BY s.id, s.register_no, s.name, s.department, r.room_number
        HAVING absent_days > 0
        ORDER BY absent_days DESC, total_days DESC
        LIMIT ?`,
      [limit]
    );
    return rows.map((r) => ({
      ...r,
      total_days: Number(r.total_days),
      absent_days: Number(r.absent_days),
    }));
  },
};

module.exports = dashboardRepository;
