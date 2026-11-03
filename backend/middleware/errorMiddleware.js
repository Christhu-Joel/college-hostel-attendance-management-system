const ApiError = require('../utils/ApiError');

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this value already exists (duplicate entry).';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = 'Referenced record does not exist.';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    message = 'Cannot delete: this record is still referenced by other records.';
  } else if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
    statusCode = 400;
    message = 'Value violates a database constraint.';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    statusCode = 503;
    message = 'Database is not reachable. Please check that MySQL is running.';
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    statusCode = 503;
    message = 'Database not found. Run the database setup script first.';
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(statusCode >= 500 && process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
