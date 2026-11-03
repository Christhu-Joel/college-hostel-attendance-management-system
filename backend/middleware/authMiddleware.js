const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Authentication required. Please log in.'));
  }

  const payload = verifyToken(token);
  if (!payload) {
    return next(new ApiError(401, 'Session expired or invalid. Please log in again.'));
  }

  req.user = payload;
  return next();
}

module.exports = authRequired;
