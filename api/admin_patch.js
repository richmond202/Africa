const fetch = global.fetch || require('node-fetch');

const TABLE_API_BASE = process.env.TABLE_API_BASE || '';
const TABLE_API_KEY = process.env.TABLE_API_KEY || '';

function authHeaders() {
  return TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {};
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!TABLE_API_BASE) {
    return { statusCode: 500, body: JSON.stringify({ error: 'TABLE_API_BASE not configured' }) };
  }

  const table = event.queryStringParameters?.table;
  const id = event.queryStringParameters?.id;
  if (!table || !id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'table and id are required' }) };
  }

  const url = `${TABLE_API_BASE}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`;
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body || '{}';

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      },
      body
    });
    const responseBody = await response.text();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: responseBody
    };
  } catch (error) {
    console.error('admin-patch proxy error', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update backend record' }) };
  }
};
