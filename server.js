const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');

const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@africalaunch.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LaunchAdmin2026!';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_NAME = process.env.ADMIN_NAME || 'AfricaLaunch Admin';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'superadmin';
const ADMIN_ACCESS_METHOD = process.env.ADMIN_ACCESS_METHOD || 'session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'africalaunch-secret';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);
const TABLE_API_BASE = process.env.TABLE_API_BASE || '';
const TABLE_API_KEY = process.env.TABLE_API_KEY || '';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: SESSION_TIMEOUT }
}));

function isAuthenticated(req) {
  return req.session && req.session.admin === true;
}

function requireAuth(req, res, next) {
  if (isAuthenticated(req)) {
    return next();
  }
  return res.redirect('/login');
}

app.get('/login', (req, res) => {
  if (isAuthenticated(req)) {
    return res.redirect('/admin');
  }
  return res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  let ok = false;
  if (email === ADMIN_EMAIL) {
    if (ADMIN_PASSWORD_HASH) {
      try {
        const bcrypt = require('bcrypt');
        ok = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
      } catch (e) { console.error('bcrypt compare error', e); }
    } else {
      ok = password === ADMIN_PASSWORD;
    }
  }
  if (ok) {
    req.session.admin = true;
    return res.redirect('/admin');
  }
  return res.redirect('/login?error=1');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get(['/admin', '/admin.html'], requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin-data/:table', requireAuth, async (req, res) => {
  if (!TABLE_API_BASE) {
    return res.status(500).json({ error: 'TABLE_API_BASE not configured' });
  }
  const table = encodeURIComponent(req.params.table);
  const limit = encodeURIComponent(req.query.limit || '100');
  const url = `${TABLE_API_BASE}/${table}?limit=${limit}`;
  try {
    const response = await fetch(url, {
      headers: TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {}
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin data fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch admin data' });
  }
});

app.get('/admin/meta', requireAuth, (req, res) => {
  return res.json({
    name: ADMIN_NAME,
    role: ADMIN_ROLE,
    accessMethod: ADMIN_ACCESS_METHOD,
    sessionTimeout: SESSION_TIMEOUT,
    email: ADMIN_EMAIL
  });
});

app.get('/auth/status', (req, res) => {
  return res.json({ authenticated: !!req.session?.admin });
});

app.patch('/admin/patch/:table/:id', requireAuth, async (req, res) => {
  if (!TABLE_API_BASE) {
    return res.status(500).json({ error: 'TABLE_API_BASE not configured' });
  }
  const table = encodeURIComponent(req.params.table);
  const id = encodeURIComponent(req.params.id);
  const url = `${TABLE_API_BASE}/${table}/${id}`;
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {})
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin patch error:', error);
    return res.status(500).json({ error: 'Failed to update backend record' });
  }
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`AfricaLaunch admin backend running at http://localhost:${port}`);
});
