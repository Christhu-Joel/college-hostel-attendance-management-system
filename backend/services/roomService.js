const roomRepository = require('../repositories/roomRepository');
const studentRepository = require('../repositories/studentRepository');
const ApiError = require('../utils/ApiError');
const {
  requiredString,
  requiredInt,
  optionalInt,
  optionalEnum,
  normalizePage,
} = require('../utils/validators');

const roomService = {
  async list(query) {
    const filters = {
      search: query.search ? String(query.search).trim() : undefined,
      status: optionalEnum(query.status, 'status', ['available', 'full']),
    };
    const { page, size, offset } = normalizePage(query.page, query.size, 10, 100);
    const { rows, total } = await roomRepository.findAll(filters, { offset, size });
    return { data: rows, pagination: { page, size, total, pages: Math.ceil(total / size) } };
  },

  async get(id) {
    const room = await roomRepository.findById(id);
    if (!room) throw new ApiError(404, 'Room not found');
    const occupants = await roomRepository.occupants(id);
    return { ...room, occupants };
  },

  async create(body) {
    const roomNumber = requiredString(body.room_number, 'room_number', { max: 20 }).toUpperCase();
    const capacity = requiredInt(body.capacity, 'capacity', { min: 1, max: 20 });
    if (await roomRepository.findByNumber(roomNumber)) {
      throw new ApiError(409, 'Room number already exists');
    }
    const id = await roomRepository.create({ roomNumber, capacity });
    return this.get(id);
  },

  async update(id, body) {
    await this.get(id);
    const fields = {};
    if (body.room_number !== undefined) {
      const roomNumber = requiredString(body.room_number, 'room_number', { max: 20 }).toUpperCase();
      const dup = await roomRepository.findByNumber(roomNumber);
      if (dup && dup.id !== Number(id)) throw new ApiError(409, 'Room number already exists');
      fields.room_number = roomNumber;
    }
    if (body.capacity !== undefined) {
      const capacity = requiredInt(body.capacity, 'capacity', { min: 1, max: 20 });
      const current = await roomRepository.findById(id);
      if (capacity < current.current_strength) {
        throw new ApiError(400, `Capacity cannot be less than current occupancy (${current.current_strength})`);
      }
      fields.capacity = capacity;
    }
    if (Object.keys(fields).length) {
      await roomRepository.update(id, fields);
    }
    return this.get(id);
  },

  async remove(id) {
    const room = await this.get(id);
    if (room.occupants.length > 0) {
      throw new ApiError(409, `Cannot delete room: ${room.occupants.length} student(s) still assigned`);
    }
    await roomRepository.delete(id);
  },

  async assignStudent(roomId, body) {
    const room = await this.get(roomId);
    const studentId = requiredInt(body.student_id, 'student_id', { min: 1 });
    const student = await studentRepository.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found');

    const occupants = room.occupants;
    if (occupants.some((o) => o.id === Number(studentId))) {
      throw new ApiError(400, `Student is already assigned to room ${room.room_number}`);
    }
    if (occupants.length >= room.capacity) {
      throw new ApiError(400, `Room ${room.room_number} is full (capacity ${room.capacity})`);
    }

    const oldRoomId = student.room_id;
    await studentRepository.update(studentId, { room_id: roomId });
    await roomRepository.syncStrength(roomId);
    if (oldRoomId) await roomRepository.syncStrength(oldRoomId);
    return this.get(roomId);
  },

  async transferStudent(studentId, toRoomId) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found');
    if (student.room_id === null) {
      throw new ApiError(400, 'Student is not assigned to any room; use assign instead');
    }
    const toRoom = await roomRepository.findById(toRoomId);
    if (!toRoom) throw new ApiError(404, 'Destination room not found');
    const toOccupants = await roomRepository.occupants(toRoomId);
    if (toOccupants.some((o) => o.id === Number(studentId))) {
      throw new ApiError(400, `Student is already in room ${toRoom.room_number}`);
    }
    if (toOccupants.length >= toRoom.capacity) {
      throw new ApiError(400, `Room ${toRoom.room_number} is full (capacity ${toRoom.capacity})`);
    }

    const fromRoomId = student.room_id;
    await studentRepository.update(studentId, { room_id: toRoomId });
    await roomRepository.syncStrength(toRoomId);
    await roomRepository.syncStrength(fromRoomId);
    return { from_room: fromRoomId, to_room: toRoomId };
  },

  async unassignStudent(studentId) {
    const student = await studentRepository.findById(studentId);
    if (!student) throw new ApiError(404, 'Student not found');
    if (!student.room_id) throw new ApiError(400, 'Student is not assigned to any room');
    await studentRepository.update(studentId, { room_id: null });
    await roomRepository.syncStrength(student.room_id);
    return { unassigned: true };
  },

  async summary() {
    return roomRepository.summary();
  },
};

module.exports = roomService;
