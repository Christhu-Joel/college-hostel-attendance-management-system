const academicYearService = require('../services/academicYearService');
const asyncHandler = require('../utils/asyncHandler');

const academicYearController = {
  list: asyncHandler(async (req, res) => {
    const data = await academicYearService.list();
    res.json({ success: true, data });
  }),

  create: asyncHandler(async (req, res) => {
    const data = await academicYearService.create(req.body);
    res.status(201).json({ success: true, message: 'Academic year created', data });
  }),

  activate: asyncHandler(async (req, res) => {
    const data = await academicYearService.activate(req.params.id);
    res.json({ success: true, message: 'Academic year activated', data });
  }),

  archive: asyncHandler(async (req, res) => {
    const data = await academicYearService.archive(req.params.id);
    res.json({ success: true, message: 'Academic year archived', data });
  }),

  active: asyncHandler(async (req, res) => {
    const data = await academicYearService.getActive();
    res.json({ success: true, data });
  }),
};

module.exports = academicYearController;
