const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/mark', attendanceController.mark);
router.get('/history', attendanceController.history);
router.get('/:date', attendanceController.getForDate);
router.put('/:id', attendanceController.update);

module.exports = router;
