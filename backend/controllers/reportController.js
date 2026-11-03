const reportService = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');

const reportController = {
  daily: asyncHandler(async (req, res) => {
    const data = await reportService.dailyReport(req.query);
    res.json({ success: true, data });
  }),

  period: asyncHandler(async (req, res) => {
    const data = await reportService.periodReport(req.params.period, req.query);
    res.json({ success: true, data });
  }),

  students: asyncHandler(async (req, res) => {
    const data = await reportService.studentReport(req.query);
    res.json({ success: true, data });
  }),

  rooms: asyncHandler(async (req, res) => {
    const data = await reportService.roomReport(req.query);
    res.json({ success: true, data });
  }),

  meta: asyncHandler(async (req, res) => {
    const data = await reportService.meta();
    res.json({ success: true, data });
  }),
};

module.exports = reportController;
