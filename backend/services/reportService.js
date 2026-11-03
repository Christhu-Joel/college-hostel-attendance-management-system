const reportRepository = require('../repositories/reportRepository');
const chartRepository = require('../repositories/chartRepository');
const studentRepository = require('../repositories/studentRepository');
const roomRepository = require('../repositories/roomRepository');
const academicYearRepository = require('../repositories/academicYearRepository');
const ApiError = require('../utils/ApiError');
const { normalizeDateRange, optionalInt } = require('../utils/validators');

function buildDateRange(period) {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now);
  switch (period) {
    case 'daily':
      start.setDate(start.getDate() - 1);
      break;
    case 'weekly':
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start.setDate(start.getDate() - 30);
      break;
    case 'academic_year':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  return { from: start.toISOString().slice(0, 10), to: end };
}

const reportService = {
  async dailyReport(query) {
    const { fromDate, toDate } = normalizeDateRange(query.from, query.to);
    const from = fromDate || query.from;
    const to = toDate || query.to;
    const academicYearId = optionalInt(query.academic_year_id, 'academic_year_id', { min: 1 });
    if (!from || !to) throw new ApiError(400, 'from and to dates are required for daily report');
    const filters = { from, to, academic_year_id: academicYearId };
    const rows = await reportRepository.dailyTotals(filters);
    const studentRows = await reportRepository.presentStudentsByDate(filters);
    const students = {};
    for (const s of studentRows) {
      const dateKey = s.date && s.date.toISOString ? s.date.toISOString().slice(0, 10) : String(s.date).slice(0, 10);
      if (!students[dateKey]) students[dateKey] = [];
      students[dateKey].push({
        student_name: s.name,
        register_no: s.register_no,
        room_number: s.room_number,
        category: s.category,
        department: s.department,
      });
    }
    return { type: 'daily', from, to, data: rows, students };
  },

  async periodReport(period, query) {
    const academicYearId = optionalInt(query.academic_year_id, 'academic_year_id', { min: 1 });
    const range = buildDateRange(period);
    const rows = await reportRepository.dailyTotals({ ...range, academic_year_id: academicYearId });
    return { type: period, from: range.from, to: range.to, data: rows };
  },

  async studentReport(query) {
    const { fromDate, toDate } = normalizeDateRange(query.from, query.to);
    const academicYearId = optionalInt(query.academic_year_id, 'academic_year_id', { min: 1 });
    const rows = await reportRepository.studentReport({
      from: fromDate,
      to: toDate,
      academic_year_id: academicYearId,
      student_id: optionalInt(query.student_id, 'student_id', { min: 1 }),
      room_id: optionalInt(query.room_id, 'room_id', { min: 1 }),
      department: query.department || undefined,
      category: query.category || undefined,
    });
    return rows;
  },

  async roomReport(query) {
    const { fromDate, toDate } = normalizeDateRange(query.from, query.to);
    const academicYearId = optionalInt(query.academic_year_id, 'academic_year_id', { min: 1 });
    const rows = await reportRepository.roomReport({
      from: fromDate,
      to: toDate,
      academic_year_id: academicYearId,
    });
    return rows;
  },

  async charts(query) {
    const academicYearId = optionalInt(query.academic_year_id, 'academic_year_id', { min: 1 });
    const [monthly, roomOccupancy, hallWise, percentages] = await Promise.all([
      chartRepository.monthlyTrend(12, academicYearId),
      chartRepository.roomOccupancy(),
      chartRepository.hallWise(academicYearId),
      chartRepository.attendancePercentagePerStudent(academicYearId, 15),
    ]);
    return { monthly, roomOccupancy, hallWise, percentages };
  },

  async meta() {
    const [departments, rooms, years] = await Promise.all([
      studentRepository.distinctDepartments(),
      roomRepository.findAll({}, { offset: 0, size: 1000 }).then((r) => r.rows),
      academicYearRepository.findAll(),
    ]);
    return { departments, rooms, academicYears: years };
  },
};

module.exports = reportService;
