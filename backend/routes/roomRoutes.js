const router = require('express').Router();
const roomController = require('../controllers/roomController');

router.get('/', roomController.list);
router.get('/summary', roomController.summary);
router.get('/:id', roomController.get);
router.post('/', roomController.create);
router.put('/:id', roomController.update);
router.delete('/:id', roomController.remove);
router.post('/:id/assign', roomController.assignStudent);
router.post('/students/:studentId/transfer', roomController.transferStudent);
router.post('/students/:studentId/unassign', roomController.unassignStudent);

module.exports = router;
