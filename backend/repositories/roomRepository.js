const { pool } = require('../config/db');

const roomRepository = {
  async findAll(filters = {}, { offset, size }) {
    const where = [];
    const params = [];

    if (filters.search) {
      where.push('r.room_number LIKE ?');
      params.push(`%${filters.search}%`);
    }
    if (filters.status === 'available') {
      where.push('r.current_strength < r.capacity');
    } else if (filters.status === 'full') {
      where.push('r.current_strength >= r.capacity');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT r.id, r.room_number, r.capacity, r.current_strength,
              (CAST(r.capacity AS SIGNED) - CAST(r.current_strength AS SIGNED)) AS available_beds,
              r.created_at, r.updated_at
         FROM rooms r
         ${whereSql}
         ORDER BY r.room_number ASC
         LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM rooms r ${whereSql}`,
      params
    );

    return { rows, total };
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT r.id, r.room_number, r.capacity, r.current_strength,
              (CAST(r.capacity AS SIGNED) - CAST(r.current_strength AS SIGNED)) AS available_beds
         FROM rooms r WHERE r.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByNumber(roomNumber) {
    const [rows] = await pool.query('SELECT * FROM rooms WHERE room_number = ?', [roomNumber]);
    return rows[0] || null;
  },

  async create({ roomNumber, capacity }) {
    const [result] = await pool.query(
      'INSERT INTO rooms (room_number, capacity) VALUES (?, ?)',
      [roomNumber, capacity]
    );
    return result.insertId;
  },

  async update(id, fields) {
    const keys = Object.keys(fields);
    if (!keys.length) return 0;
    const sets = keys.map((k) => `${k} = ?`);
    const values = keys.map((k) => fields[k]);
    const [result] = await pool.query(
      `UPDATE rooms SET ${sets.join(', ')} WHERE id = ?`,
      [...values, id]
    );
    return result.affectedRows;
  },

  async delete(id) {
    const [result] = await pool.query('DELETE FROM rooms WHERE id = ?', [id]);
    return result.affectedRows;
  },

  async occupants(roomId) {
    const [rows] = await pool.query(
      `SELECT s.id, s.register_no, s.name, s.category, s.department, s.study_year, s.status
         FROM students s
        WHERE s.room_id = ?
        ORDER BY s.register_no ASC`,
      [roomId]
    );
    return rows;
  },

  async syncStrength(roomId) {
    await pool.query(
      `UPDATE rooms r SET r.current_strength = (
         SELECT COUNT(*) FROM students s
         WHERE s.room_id = r.id AND s.status = 'active'
       ) WHERE r.id = ?`,
      [roomId]
    );
  },

  async syncAllStrengths() {
    await pool.query(
      `UPDATE rooms r SET r.current_strength = (
         SELECT COUNT(*) FROM students s
         WHERE s.room_id = r.id AND s.status = 'active'
       )`
    );
  },

  async summary() {
    const [[{ total_rooms, total_capacity, occupied }]] = await pool.query(
      `SELECT COUNT(*) AS total_rooms,
              COALESCE(SUM(capacity), 0) AS total_capacity,
              COALESCE(SUM(current_strength), 0) AS occupied
         FROM rooms`
    );
    return {
      totalRooms: total_rooms,
      totalCapacity: total_capacity,
      occupied,
      available: total_capacity - occupied,
      occupancyRate: total_capacity ? Math.round((occupied / total_capacity) * 100) : 0,
    };
  },
};

module.exports = roomRepository;
