const ApiError = require('./ApiError');

const isMissing = (v) => v === undefined || v === null || v === '';
const trimStr = (v) => (typeof v === 'string' ? v.trim() : v);

function requiredString(value, field, { max = 255, min = 1 } = {}) {
  const v = trimStr(value);
  if (isMissing(v)) throw new ApiError(400, `${field} is required`);
  if (v.length < min) throw new ApiError(400, `${field} must be at least ${min} character(s)`);
  if (v.length > max) throw new ApiError(400, `${field} must be at most ${max} characters`);
  return v;
}

function requiredEnum(value, field, allowed) {
  const v = trimStr(value);
  if (isMissing(v)) throw new ApiError(400, `${field} is required`);
  if (!allowed.includes(v)) {
    throw new ApiError(400, `${field} must be one of: ${allowed.join(', ')}`);
  }
  return v;
}

function optionalEnum(value, field, allowed) {
  if (isMissing(value)) return undefined;
  return requiredEnum(value, field, allowed);
}

function requiredInt(value, field, { min, max } = {}) {
  if (isMissing(value)) throw new ApiError(400, `${field} is required`);
  const n = Number(value);
  if (!Number.isInteger(n)) throw new ApiError(400, `${field} must be an integer`);
  if (min !== undefined && n < min) throw new ApiError(400, `${field} must be >= ${min}`);
  if (max !== undefined && n > max) throw new ApiError(400, `${field} must be <= ${max}`);
  return n;
}

function optionalInt(value, field, opts) {
  if (isMissing(value)) return undefined;
  return requiredInt(value, field, opts);
}

function requiredDate(value, field) {
  const v = trimStr(value);
  if (isMissing(v)) throw new ApiError(400, `${field} is required`);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new ApiError(400, `${field} must be a valid date (YYYY-MM-DD)`);
  return v.slice(0, 10);
}

function optionalDate(value, field) {
  if (isMissing(value)) return undefined;
  return requiredDate(value, field);
}

function normalizePage(page, size, defaultSize = 10, maxSize = 100) {
  const p = Number.isInteger(Number(page)) && Number(page) >= 1 ? Number(page) : 1;
  let s = Number.isInteger(Number(size)) && Number(size) >= 1 ? Number(size) : defaultSize;
  s = Math.min(s, maxSize);
  return { page: p, size: s, offset: (p - 1) * s };
}

function normalizeDateRange(from, to) {
  const fromDate = optionalDate(from, 'from');
  const toDate = optionalDate(to, 'to');
  if (fromDate && toDate && fromDate > toDate) {
    throw new ApiError(400, '`from` date cannot be after `to` date');
  }
  return { fromDate, toDate };
}

module.exports = {
  requiredString,
  requiredEnum,
  optionalEnum,
  requiredInt,
  optionalInt,
  requiredDate,
  optionalDate,
  normalizePage,
  normalizeDateRange,
  trimStr,
};
