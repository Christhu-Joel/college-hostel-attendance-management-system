const roomService = require('../services/roomService');
const asyncHandler = require('../utils/asyncHandler');

const roomController = {
  list: asyncHandler(async (req, res) => {
    const result = await roomService.list(req.query);
    res.json({ success: true, ...result });
  }),

  get: asyncHandler(async (req, res) => {
    const room = await roomService.get(req.params.id);
    res.json({ success: true, data: room });
  }),

  create: asyncHandler(async (req, res) => {
    const room = await roomService.create(req.body);
    res.status(201).json({ success: true, message: 'Room created', data: room });
  }),

  update: asyncHandler(async (req, res) => {
    const room = await roomService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Room updated', data: room });
  }),

  remove: asyncHandler(async (req, res) => {
    await roomService.remove(req.params.id);
    res.json({ success: true, message: 'Room deleted' });
  }),

  assignStudent: asyncHandler(async (req, res) => {
    const room = await roomService.assignStudent(req.params.id, req.body);
    res.json({ success: true, message: 'Student assigned to room', data: room });
  }),

  transferStudent: asyncHandler(async (req, res) => {
    const result = await roomService.transferStudent(req.params.studentId, req.body.to_room_id);
    res.json({ success: true, message: 'Student transferred', data: result });
  }),

  unassignStudent: asyncHandler(async (req, res) => {
    const result = await roomService.unassignStudent(req.params.studentId);
    res.json({ success: true, message: 'Student unassigned from room', data: result });
  }),

  summary: asyncHandler(async (req, res) => {
    const summary = await roomService.summary();
    res.json({ success: true, data: summary });
  }),
};

module.exports = roomController;
