const { getSession } = require('./_lib/auth');

exports.handler = async function (event) {
  const session = getSession(event.headers);
  if (!session) {
    return { statusCode: 401, body: JSON.stringify({ authenticated: false }) };
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authenticated: true,
      name: session.name,
      role: session.role,
      method: process.env.ADMIN_ACCESS_METHOD || 'session',
      email: session.email
    })
  };
};
