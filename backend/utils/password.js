const crypto = require('crypto');

const KEY_LENGTH = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;

  const derived = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  const derivedBuf = Buffer.from(derived, 'hex');
  const keyBuf = Buffer.from(key, 'hex');
  if (derivedBuf.length !== keyBuf.length) return false;

  return crypto.timingSafeEqual(derivedBuf, keyBuf);
}

module.exports = { hashPassword, verifyPassword };
