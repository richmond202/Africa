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
const SESSION_SECRET = process.env.SESSION_SECRET || 'africalaunch-secret';
const TABLE_API_BASE = process.env.TABLE_API_BASE || '';
const TABLE_API_KEY = process.env.TABLE_API_KEY || '';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false }
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

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
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
