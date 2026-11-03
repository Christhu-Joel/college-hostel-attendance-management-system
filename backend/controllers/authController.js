const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');

const authController = {
  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    res.json({ success: true, message: 'Logged in', data });
  }),

  me: asyncHandler(async (req, res) => {
    const data = await authService.me(req.user.id);
    res.json({ success: true, data });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const data = await authService.changePassword(req.user.id, req.body);
    res.json({ success: true, message: 'Password updated', data });
  }),
};

module.exports = authController;
