const attendanceService = require('../services/attendanceService');
const asyncHandler = require('../utils/asyncHandler');

const attendanceController = {
  mark: asyncHandler(async (req, res) => {
    const result = await attendanceService.markForDate(req.body);
    res.json({ success: true, message: 'Attendance recorded', data: result });
  }),

  getForDate: asyncHandler(async (req, res) => {
    const result = await attendanceService.getForDate(req.params.date, req.query);
    res.json({ success: true, data: result });
  }),

  update: asyncHandler(async (req, res) => {
    const result = await attendanceService.updateRecord(req.params.id, req.body);
    res.json({ success: true, message: 'Attendance updated', data: result });
  }),

  history: asyncHandler(async (req, res) => {
    const result = await attendanceService.history(req.query);
    res.json({ success: true, ...result });
  }),
};

module.exports = attendanceController;
