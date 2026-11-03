const router = require('express').Router();
const academicYearController = require('../controllers/academicYearController');

router.get('/', academicYearController.list);
router.get('/active', academicYearController.active);
router.post('/', academicYearController.create);
router.post('/:id/activate', academicYearController.activate);
router.post('/:id/archive', academicYearController.archive);

module.exports = router;
