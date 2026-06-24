const fetch = global.fetch || require('node-fetch');

const TABLE_API_BASE = process.env.TABLE_API_BASE || '';
const TABLE_API_KEY = process.env.TABLE_API_KEY || '';

function authHeaders() {
  return TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {};
}

function extractTableFromPath(rawUrl) {
  if (!rawUrl) return null;
  const url = new URL(rawUrl, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('admin-data');
  if (idx >= 0 && parts.length > idx + 1) {
    return parts[idx + 1];
  }
  return null;
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!TABLE_API_BASE) {
    return { statusCode: 500, body: JSON.stringify({ error: 'TABLE_API_BASE not configured' }) };
  }

  const table = event.queryStringParameters?.table || extractTableFromPath(event.rawUrl || event.path);
  const limit = event.queryStringParameters?.limit || '100';
  if (!table) {
    return { statusCode: 400, body: JSON.stringify({ error: 'table is required' }) };
  }

  const url = `${TABLE_API_BASE}/${encodeURIComponent(table)}?limit=${encodeURIComponent(limit)}`;

  try {
    const response = await fetch(url, {
      headers: authHeaders()
    });
    const body = await response.text();
    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body
    };
  } catch (error) {
    console.error('admin-data proxy error', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch admin data' }) };
  }
};
