const attendanceRepository = require('../repositories/attendanceRepository');
const studentRepository = require('../repositories/studentRepository');
const academicYearRepository = require('../repositories/academicYearRepository');
const ApiError = require('../utils/ApiError');
const {
  requiredDate,
  requiredEnum,
  optionalEnum,
  requiredInt,
  optionalInt,
  normalizePage,
  normalizeDateRange,
} = require('../utils/validators');

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const attendanceService = {
  /**
   * Mark/update attendance for a date. Accepts either a single record
   * or a bulk list, both shaped as { student_id, status }.
   */
  async markForDate({ date, records, academic_year_id }) {
    const attendanceDate = requiredDate(date, 'date');
    if (attendanceDate > todayLocal()) {
      throw new ApiError(400, 'Cannot record attendance for a future date');
    }
    if (!Array.isArray(records) || records.length === 0) {
      throw new ApiError(400, 'records must be a non-empty array');
    }
    if (records.length > 500) {
      throw new ApiError(400, 'Too many records in a single request (max 500)');
    }

    const activeYear = academic_year_id
      ? await academicYearRepository.findById(academic_year_id)
      : await academicYearRepository.getActive();
    const yearId = activeYear ? activeYear.id : null;

    const rows = [];
    const seen = new Set();
    for (const rec of records) {
      const studentId = requiredInt(rec.student_id, 'student_id', { min: 1 });
      const status = requiredEnum(rec.status, 'status', ['present', 'absent']);
      if (seen.has(studentId)) throw new ApiError(400, `Duplicate student_id in records: ${studentId}`);
      seen.add(studentId);

      const student = await studentRepository.findById(studentId);
      if (!student) throw new ApiError(404, `Student not found: ${studentId}`);
      if (student.status !== 'active') {
        throw new ApiError(400, `Cannot mark attendance for inactive student ${student.name}`);
      }
      rows.push({ studentId, date: attendanceDate, status, academicYearId: yearId });
    }

    const affected = await attendanceRepository.upsertMany(rows);
    return { date: attendanceDate, recordsUpdated: rows.length, affected };
  },

  async getForDate(date) {
    const d = requiredDate(date, 'date');
    const sheet = await attendanceRepository.getFullForDate(d);
    const counts = { present: 0, absent: 0, total: 0 };
    for (const r of sheet) {
      if (!r.attendance_id) continue;
      counts[r.attendance_status] = (counts[r.attendance_status] || 0) + 1;
      counts.total += 1;
    }
    return { date: d, counts, data: sheet, totalStudents: sheet.length };
  },

  async updateRecord(id, body) {
    const status = requiredEnum(body.status, 'status', ['present', 'absent']);
    const affected = await attendanceRepository.updateStatus(id, status);
    if (!affected) throw new ApiError(404, 'Attendance record not found');
    return { updated: true, id, status };
  },

  async history(query) {
    const { fromDate, toDate } = normalizeDateRange(query.from, query.to);
    const filters = {
      student_id: optionalInt(query.student_id, 'student_id', { min: 1 }),
      room_id: optionalInt(query.room_id, 'room_id', { min: 1 }),
      date: query.date ? requiredDate(query.date, 'date') : undefined,
      from: fromDate,
      to: toDate,
      status: optionalEnum(query.status, 'status', ['present', 'absent']),
      academic_year_id: optionalInt(query.academic_year_id, 'academic_year_id', { min: 1 }),
      search: query.search ? String(query.search).trim() : undefined,
    };
    const { page, size, offset } = normalizePage(query.page, query.size, 20, 200);
    const { rows, total } = await attendanceRepository.history(filters, { offset, size });
    return { data: rows, pagination: { page, size, total, pages: Math.ceil(total / size) } };
  },
};

module.exports = attendanceService;
