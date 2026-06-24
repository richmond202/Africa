const fetch = global.fetch || require('node-fetch');

const TABLE_API_BASE = process.env.TABLE_API_BASE || '';
const TABLE_API_KEY = process.env.TABLE_API_KEY || '';

function authHeaders() {
  return TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {};
}

function extractPathParams(rawUrl) {
  if (!rawUrl) return {};
  const url = new URL(rawUrl, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('admin');
  if (idx >= 0 && parts[idx + 1] === 'patch' && parts.length > idx + 3) {
    return { table: parts[idx + 2], id: parts[idx + 3] };
  }
  const idx2 = parts.indexOf('admin-patch');
  if (idx2 >= 0 && parts.length > idx2 + 0) {
    return { table: null, id: null };
  }
  return {};
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'PATCH' && event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!TABLE_API_BASE) {
    return { statusCode: 500, body: JSON.stringify({ error: 'TABLE_API_BASE not configured' }) };
  }

  const paramsFromPath = extractPathParams(event.rawUrl || event.path);
  const table = event.queryStringParameters?.table || paramsFromPath.table;
  const id = event.queryStringParameters?.id || paramsFromPath.id;
  if (!table || !id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'table and id are required' }) };
  }

  const url = `${TABLE_API_BASE}/${encodeURIComponent(table)}/${encodeURIComponent(id)}`;
  const body = event.isBase64Encoded
    ? Buffer.from(event.body || '', 'base64').toString('utf8')
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
