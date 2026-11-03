const academicYearRepository = require('../repositories/academicYearRepository');
const ApiError = require('../utils/ApiError');
const { requiredString } = require('../utils/validators');

function validateYearName(yearName) {
  const match = /^\d{4}-\d{4}$/.exec(yearName);
  if (!match) throw new ApiError(400, 'year_name must be in YYYY-YYYY format (e.g. 2025-2026)');
  const [start, end] = yearName.split('-').map(Number);
  if (end !== start + 1) throw new ApiError(400, 'Academic year must be consecutive (e.g. 2025-2026)');
  return yearName;
}

const academicYearService = {
  async list() {
    const rows = await academicYearRepository.findAll();
    for (const row of rows) {
      row.attendance_count = await academicYearRepository.countAttendanceByYear(row.id);
    }
    return rows;
  },

  async create(body) {
    const yearName = validateYearName(requiredString(body.year_name, 'year_name', { max: 20 }));
    if (await academicYearRepository.findByYearName(yearName)) {
      throw new ApiError(409, 'Academic year already exists');
    }
    const id = await academicYearRepository.create({ yearName });
    const year = await academicYearRepository.findById(id);
    const { id: _id, ...rest } = year;
    return { ...rest, attendance_count: 0 };
  },

  async activate(id) {
    const year = await academicYearRepository.findById(id);
    if (!year) throw new ApiError(404, 'Academic year not found');
    await academicYearRepository.activate(id);
    return { activated: true, id, year_name: year.year_name };
  },

  async archive(id) {
    const year = await academicYearRepository.findById(id);
    if (!year) throw new ApiError(404, 'Academic year not found');
    await academicYearRepository.archive(id);
    return { archived: true, id, year_name: year.year_name };
  },

  async getActive() {
    const active = await academicYearRepository.getActive();
    return active || null;
  },
};

module.exports = academicYearService;
