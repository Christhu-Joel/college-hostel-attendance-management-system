const dashboardService = require('../services/dashboardService');
const reportService = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');

const dashboardController = {
  overview: asyncHandler(async (req, res) => {
    const data = await dashboardService.getOverview();
    res.json({ success: true, data });
  }),

  charts: asyncHandler(async (req, res) => {
    const data = await dashboardService.chartData(req.query);
    res.json({ success: true, data });
  }),

  reportCharts: asyncHandler(async (req, res) => {
    const data = await reportService.charts(req.query);
    res.json({ success: true, data });
  }),
};

module.exports = dashboardController;
