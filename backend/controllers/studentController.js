const studentService = require('../services/studentService');
const asyncHandler = require('../utils/asyncHandler');

const studentController = {
  list: asyncHandler(async (req, res) => {
    const result = await studentService.list(req.query);
    res.json({ success: true, ...result });
  }),

  get: asyncHandler(async (req, res) => {
    const student = await studentService.get(req.params.id);
    res.json({ success: true, data: student });
  }),

  create: asyncHandler(async (req, res) => {
    const student = await studentService.create(req.body);
    res.status(201).json({ success: true, message: 'Student created', data: student });
  }),

  update: asyncHandler(async (req, res) => {
    const student = await studentService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Student updated', data: student });
  }),

  remove: asyncHandler(async (req, res) => {
    await studentService.remove(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  }),

  setStatus: asyncHandler(async (req, res) => {
    const student = await studentService.setStatus(req.params.id, req.body.status);
    res.json({ success: true, message: `Student marked ${student.status}`, data: student });
  }),

  departments: asyncHandler(async (req, res) => {
    const departments = await studentService.departments();
    res.json({ success: true, data: departments });
  }),
};

module.exports = studentController;
