const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/', dashboardController.overview);
router.get('/charts', dashboardController.charts);

module.exports = router;
