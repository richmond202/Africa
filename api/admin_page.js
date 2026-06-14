const fs = require('fs');
const path = require('path');
const { getSession } = require('./_lib/auth');

exports.handler = async function (event) {
  const session = getSession(event.headers);
  if (!session) {
    return {
      statusCode: 302,
      headers: { Location: '/login' },
      body: ''
    };
  }

  const filePath = path.join(__dirname, '..', 'admin.html');
  try {
    const body = fs.readFileSync(filePath, 'utf8');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      },
      body
    };
  } catch (error) {
    return { statusCode: 500, body: 'Unable to load admin page' };
  }
};
