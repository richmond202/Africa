const { clearSessionCookie } = require('./_lib/auth');

exports.handler = async function () {
  return {
    statusCode: 302,
    headers: {
      Location: '/login',
      'Set-Cookie': clearSessionCookie()
    },
    body: ''
  };
};
