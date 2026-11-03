const dashboardRepository = require('../repositories/dashboardRepository');
const { requiredInt } = require('../utils/validators');

const dashboardService = {
  async getOverview() {
    const [stats, today, rooms, recent] = await Promise.all([
      dashboardRepository.stats(),
      dashboardRepository.todayAttendance(),
      dashboardRepository.roomSummary(),
      dashboardRepository.recentActivity(10),
    ]);
    return {
      students: stats,
      today: today,
      rooms,
      recentActivity: recent,
    };
  },

  async chartData(query) {
    const days = query.days === undefined ? 14 : requiredInt(query.days, 'days', { min: 1, max: 90 });
    const limit = query.top === undefined ? 8 : requiredInt(query.top, 'top', { min: 1, max: 50 });
    const [dailyTrend, presentVsAbsent, frequentlyAbsent] = await Promise.all([
      dashboardRepository.dailyTrend(days),
      dashboardRepository.presentVsAbsent(),
      dashboardRepository.frequentlyAbsent(limit),
    ]);
    return { dailyTrend, presentVsAbsent, frequentlyAbsent };
  },
};

module.exports = dashboardService;
