const { createSessionCookie } = require('./_lib/auth');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@africalaunch.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LaunchAdmin2026!';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

function parseEventBody(event) {
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
    : event.body || '';
  const contentType = String(event.headers['content-type'] || event.headers['Content-Type'] || '').split(';')[0].trim();
  if (contentType === 'application/json') {
    return rawBody ? JSON.parse(rawBody) : {};
  }
  if (contentType === 'application/x-www-form-urlencoded') {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }
  return {};
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const body = parseEventBody(event);

  const email = body.email || '';
  const password = body.password || '';
  let ok = false;

  if (email === ADMIN_EMAIL) {
    if (ADMIN_PASSWORD_HASH) {
      const bcrypt = require('bcrypt');
      try {
        ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      } catch (err) {
        console.error('bcrypt compare failed', err);
      }
    } else {
      ok = password === ADMIN_PASSWORD;
    }
  }

  if (!ok) {
    return {
      statusCode: 302,
      headers: {
        Location: '/login?error=1'
      },
      body: ''
    };
  }

  const cookie = createSessionCookie({
    email: ADMIN_EMAIL,
    name: process.env.ADMIN_NAME || 'AfricaLaunch Admin',
    role: process.env.ADMIN_ROLE || 'superadmin',
    exp: Date.now() + parseInt(process.env.SESSION_TIMEOUT || '3600000', 10)
  });

  return {
    statusCode: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': cookie
    },
    body: ''
  };
};
