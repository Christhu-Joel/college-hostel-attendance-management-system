/**
 * Wraps an async route handler so rejected promises are forwarded
 * to the Express error-handling middleware automatically.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
