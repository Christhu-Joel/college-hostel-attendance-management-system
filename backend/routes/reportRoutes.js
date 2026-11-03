const router = require('express').Router();
const reportController = require('../controllers/reportController');
const dashboardController = require('../controllers/dashboardController');

router.get('/daily', reportController.daily);
router.get('/period/:period', reportController.period);
router.get('/students', reportController.students);
router.get('/rooms', reportController.rooms);
router.get('/charts', dashboardController.reportCharts);
router.get('/meta', reportController.meta);

module.exports = router;
