const router = require('express').Router();
const authController = require('../controllers/authController');
const authRequired = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.get('/me', authRequired, authController.me);
router.post('/change-password', authRequired, authController.changePassword);

module.exports = router;
