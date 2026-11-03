const crypto = require('crypto');
const config = require('../config/config');

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64');
}

function encodePart(obj) {
  return base64UrlEncode(JSON.stringify(obj));
}

function sign(data) {
  return base64UrlEncode(crypto.createHmac('sha256', config.auth.secret).update(data).digest());
}

function createToken(payload) {
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + config.auth.tokenTtlSeconds,
  };

  const header = encodePart({ alg: 'HS256', typ: 'JWT' });
  const claims = encodePart(body);
  const data = `${header}.${claims}`;
  return `${data}.${sign(data)}`;
}

function verifyToken(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, claims, signature] = parts;
  const data = `${header}.${claims}`;
  const expected = sign(data);

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  let payload;
  try {
    payload = JSON.parse(base64UrlDecode(claims).toString('utf8'));
  } catch {
    return null;
  }

  if (!payload || typeof payload.exp !== 'number') return null;
  if (Math.floor(Date.now() / 1000) >= payload.exp) return null;

  return payload;
}

module.exports = { createToken, verifyToken };
