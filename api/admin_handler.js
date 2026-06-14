const fs = require('fs');
const path = require('path');

exports.handler = async function (event) {
  const pathname = new URL(event.rawUrl).pathname;
  const filePath = path.join(__dirname, '..', pathname);
  if (!filePath.startsWith(path.join(__dirname, '..')) || filePath.includes('..')) {
    return { statusCode: 404, body: 'Not found' };
  }

  try {
    const body = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg'
    }[ext] || 'application/octet-stream';
    return { statusCode: 200, headers: { 'Content-Type': contentType }, body: body.toString('utf8') };
  } catch (err) {
    return { statusCode: 404, body: 'Not found' };
  }
};
