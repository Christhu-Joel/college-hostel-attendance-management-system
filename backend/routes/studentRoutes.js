const router = require('express').Router();
const studentController = require('../controllers/studentController');

router.get('/', studentController.list);
router.get('/departments', studentController.departments);
router.get('/:id', studentController.get);
router.post('/', studentController.create);
router.put('/:id', studentController.update);
router.delete('/:id', studentController.remove);
router.patch('/:id/status', studentController.setStatus);

module.exports = router;
