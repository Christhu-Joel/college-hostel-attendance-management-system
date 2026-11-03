const studentRepository = require('../repositories/studentRepository');
const roomRepository = require('../repositories/roomRepository');
const ApiError = require('../utils/ApiError');
const {
  requiredString,
  requiredEnum,
  requiredInt,
  optionalInt,
  optionalEnum,
  normalizePage,
} = require('../utils/validators');

const studentService = {
  async list(query) {
    const filters = {
      search: query.search ? String(query.search).trim() : undefined,
      category: optionalEnum(query.category, 'category', ['UG', 'PG']),
      department: query.department ? String(query.department).trim() : undefined,
      study_year: optionalInt(query.study_year, 'study_year', { min: 1, max: 6 }),
      room_id: optionalInt(query.room_id, 'room_id', { min: 1 }),
      status: optionalEnum(query.status, 'status', ['active', 'inactive']),
    };
    const { page, size, offset } = normalizePage(query.page, query.size, 10, 100);
    const { rows, total } = await studentRepository.findAll(filters, { offset, size });
    return { data: rows, pagination: { page, size, total, pages: Math.ceil(total / size) } };
  },

  async get(id) {
    const student = await studentRepository.findById(id);
    if (!student) throw new ApiError(404, 'Student not found');
    return student;
  },

  async create(body) {
    const registerNo = requiredString(body.register_no, 'register_no', { max: 30 });
    const name = requiredString(body.name, 'name', { max: 100 });
    const category = requiredEnum(body.category, 'category', ['UG', 'PG']);
    const department = requiredString(body.department, 'department', { max: 100 });
    const studyYear = requiredInt(body.study_year, 'study_year', { min: 1, max: 6 });
    const roomId = optionalInt(body.room_id, 'room_id', { min: 1 });
    const status = body.status === undefined ? 'active' : requiredEnum(body.status, 'status', ['active', 'inactive']);

    if (await studentRepository.findByRegisterNo(registerNo)) {
      throw new ApiError(409, 'Register number already exists');
    }

    if (roomId !== undefined) {
      await this.ensureRoomCapacity(roomId);
    }

    const id = await studentRepository.create({
      registerNo, name, category, department, studyYear, roomId, status,
    });
    if (roomId !== undefined) await roomRepository.syncStrength(roomId);
    return this.get(id);
  },

  async update(id, body) {
    const existing = await this.get(id);

    const fields = {};
    if (body.name !== undefined) fields.name = requiredString(body.name, 'name', { max: 100 });
    if (body.category !== undefined) fields.category = requiredEnum(body.category, 'category', ['UG', 'PG']);
    if (body.department !== undefined) fields.department = requiredString(body.department, 'department', { max: 100 });
    if (body.study_year !== undefined) fields.study_year = requiredInt(body.study_year, 'study_year', { min: 1, max: 6 });
    if (body.register_no !== undefined) {
      const registerNo = requiredString(body.register_no, 'register_no', { max: 30 });
      const dup = await studentRepository.findByRegisterNo(registerNo);
      if (dup && dup.id !== Number(id)) throw new ApiError(409, 'Register number already exists');
      fields.register_no = registerNo;
    }
    if (body.status !== undefined) fields.status = requiredEnum(body.status, 'status', ['active', 'inactive']);

    let roomChanged = false;
    if (body.room_id !== undefined) {
      const roomId = body.room_id === null || body.room_id === '' ? null : requiredInt(body.room_id, 'room_id', { min: 1 });
      if (roomId !== existing.room_id) {
        if (roomId !== null) await this.ensureRoomCapacity(roomId, Number(id));
        fields.room_id = roomId;
        roomChanged = true;
      }
    }

    if (Object.keys(fields).length) {
      await studentRepository.update(id, fields);
    }
    if (roomChanged) {
      if (existing.room_id) await roomRepository.syncStrength(existing.room_id);
      if (fields.room_id) await roomRepository.syncStrength(fields.room_id);
    }
    return this.get(id);
  },

  async remove(id) {
    await this.get(id);
    await studentRepository.delete(id);
    await roomRepository.syncAllStrengths();
  },

  async setStatus(id, status) {
    const existing = await this.get(id);
    const newStatus = requiredEnum(status, 'status', ['active', 'inactive']);
    if (newStatus === existing.status) return existing;
    await studentRepository.update(id, { status: newStatus });
    if (existing.room_id) await roomRepository.syncStrength(existing.room_id);
    return this.get(id);
  },

  async departments() {
    return studentRepository.distinctDepartments();
  },

  async ensureRoomCapacity(roomId, excludeStudentId) {
    const room = await roomRepository.findById(roomId);
    if (!room) throw new ApiError(404, 'Room not found');
    const occupants = await roomRepository.occupants(roomId);
    const countInRoom = excludeStudentId
      ? occupants.filter((o) => o.id !== Number(excludeStudentId)).length
      : occupants.length;
    if (countInRoom >= room.capacity) {
      throw new ApiError(400, `Room ${room.room_number} is full (capacity ${room.capacity})`);
    }
  },
};

module.exports = studentService;
