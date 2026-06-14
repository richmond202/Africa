const crypto = require('crypto');

const COOKIE_NAME = 'africa_admin';
const SECRET = process.env.SESSION_SECRET || 'africalaunch-secret';
const TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);
const SECURE = process.env.COOKIE_SECURE === 'true';

function base64UrlEncode(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  let encoded = value.replace(/-/g, '+').replace(/_/g, '/');
  while (encoded.length % 4) encoded += '=';
  return Buffer.from(encoded, 'base64').toString('utf8');
}

function sign(data) {
  return crypto.createHmac('sha256', SECRET).update(data).digest('hex');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((cookies, cookiePair) => {
    const [name, ...rest] = cookiePair.split('=');
    if (!name) return cookies;
    cookies[name.trim()] = decodeURIComponent((rest.join('=' ) || '').trim());
    return cookies;
  }, {});
}

function createSession(payload) {
  const json = JSON.stringify(payload);
  const data = base64UrlEncode(json);
  const signature = sign(data);
  return `${data}.${signature}`;
}

function verifySession(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  if (sign(data) !== signature) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(data));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch (error) {
    return null;
  }
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks).toString('utf8');
      const contentType = String(req.headers['content-type'] || '').split(';')[0].trim();
      if (contentType === 'application/json') {
        try {
          return resolve(rawBody ? JSON.parse(rawBody) : {});
        } catch (error) {
          return reject(error);
        }
      }
      if (contentType === 'application/x-www-form-urlencoded') {
        return resolve(Object.fromEntries(new URLSearchParams(rawBody)));
      }
      return resolve({});
    });
    req.on('error', reject);
  });
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return verifySession(cookies[COOKIE_NAME]);
}

function createSessionCookie(payload) {
  const token = createSession(payload);
  const maxAge = Math.floor(TIMEOUT / 1000);
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`
  ];
  if (SECURE) parts.push('Secure');
  return parts.join('; ');
}

function clearSessionCookie() {
  const parts = [`${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`];
  if (SECURE) parts.push('Secure');
  return parts.join('; ');
}

module.exports = {
  parseBody,
  getSession,
  createSessionCookie,
  clearSessionCookie,
  TIMEOUT
};
