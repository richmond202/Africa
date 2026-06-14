exports.handler = async function () {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: process.env.ADMIN_NAME || 'AfricaLaunch Admin',
      role: process.env.ADMIN_ROLE || 'superadmin',
      accessMethod: (process.env.ADMIN_ACCESS_METHOD || 'session').toLowerCase(),
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000', 10),
      email: process.env.ADMIN_EMAIL || 'admin@africalaunch.com'
    })
  };
};
