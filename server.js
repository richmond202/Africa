const express = require('express');
const path = require('path');
const session = require('express-session');
const dotenv = require('dotenv');

const fetch = global.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

dotenv.config();

// In-memory audit log (for demo; use database in production)
const auditLog = [];

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@africalaunch.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'LaunchAdmin2026!';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
const ADMIN_NAME = process.env.ADMIN_NAME || 'AfricaLaunch Admin';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'superadmin';
const ADMIN_ACCESS_METHOD = (process.env.ADMIN_ACCESS_METHOD || 'session').toLowerCase();
const SESSION_SECRET = process.env.SESSION_SECRET || 'africalaunch-secret';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '3600000', 10);
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true';
const TABLE_API_BASE = process.env.TABLE_API_BASE || '';
const TABLE_API_KEY = process.env.TABLE_API_KEY || '';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    maxAge: SESSION_TIMEOUT
  }
}));

function authenticateRequest(req) {
  if (req.session?.admin === true) {
    return { authenticated: true, via: 'session' };
  }
  if (ADMIN_ACCESS_METHOD === 'token' && ADMIN_API_KEY) {
    const authorization = String(req.headers.authorization || '').trim();
    if (authorization === `Bearer ${ADMIN_API_KEY}`) {
      return { authenticated: true, via: 'token' };
    }
  }
  return { authenticated: false };
}

function isApiRequest(req) {
  return req.path.startsWith('/admin-data')
    || req.path.startsWith('/admin/patch')
    || req.path === '/admin/meta'
    || req.path === '/auth/status'
    || req.path.startsWith('/api/admin');
}

// Audit logging helper
function logAudit(adminEmail, action, table, recordId, changes) {
  auditLog.push({
    timestamp: new Date().toISOString(),
    admin: adminEmail,
    action,
    table,
    recordId,
    changes,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  });
  // Keep only last 1000 logs in memory
  if (auditLog.length > 1000) {
    auditLog.shift();
  }
}

function requireAuth(req, res, next) {
  const auth = authenticateRequest(req);
  if (auth.authenticated) {
    if (req.session?.admin === true) {
      req.session.cookie.maxAge = SESSION_TIMEOUT;
    }
    req.admin = {
      name: ADMIN_NAME,
      role: ADMIN_ROLE,
      method: auth.via || ADMIN_ACCESS_METHOD,
      email: ADMIN_EMAIL
    };
    return next();
  }

  if (isApiRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.redirect('/login');
}

app.get('/login', (req, res) => {
  if (authenticateRequest(req).authenticated) {
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
    req.session.name = ADMIN_NAME;
    req.session.role = ADMIN_ROLE;
    req.session.email = ADMIN_EMAIL;
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
    accessMethod: req.admin?.method || ADMIN_ACCESS_METHOD,
    sessionTimeout: SESSION_TIMEOUT,
    email: ADMIN_EMAIL
  });
});

app.get('/auth/status', requireAuth, (req, res) => {
  return res.json({
    authenticated: true,
    name: ADMIN_NAME,
    role: ADMIN_ROLE,
    method: req.admin?.method || ADMIN_ACCESS_METHOD,
    email: ADMIN_EMAIL
  });
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
    
    // Log this action to audit trail
    logAudit(ADMIN_EMAIL, 'PATCH', decodeURIComponent(table), id, req.body);
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin patch error:', error);
    return res.status(500).json({ error: 'Failed to update backend record' });
  }
});

// Analytics endpoint — summary of ecosystem data
app.get('/api/admin/analytics', requireAuth, async (req, res) => {
  try {
    const tables = ['startups', 'investors', 'events'];
    const analytics = {};
    
    for (const table of tables) {
      if (!TABLE_API_BASE) continue;
      const url = `${TABLE_API_BASE}/${table}?limit=1000`;
      try {
        const response = await fetch(url, {
          headers: TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {}
        });
        const data = await response.json();
        const records = data.data || data || [];
        
        analytics[table] = {
          total: records.length,
          breakdown: {}
        };
        
        if (table === 'startups') {
          analytics[table].breakdown = {
            approved: records.filter(s => s.status === 'approved').length,
            pending: records.filter(s => s.status === 'pending').length,
            rejected: records.filter(s => s.status === 'rejected').length,
            featured: records.filter(s => s.is_featured).length
          };
        } else if (table === 'investors') {
          analytics[table].breakdown = {
            verified: records.filter(i => i.verified).length,
            pending: records.filter(i => !i.verified).length
          };
        } else if (table === 'events') {
          analytics[table].breakdown = {
            upcoming: records.filter(e => e.status === 'upcoming').length,
            ongoing: records.filter(e => e.status === 'ongoing').length,
            completed: records.filter(e => e.status === 'completed').length
          };
        }
      } catch (err) {
        console.error(`Analytics fetch error for ${table}:`, err);
      }
    }
    
    return res.json({
      timestamp: new Date().toISOString(),
      analytics,
      auditLogCount: auditLog.length
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Audit log endpoint — view admin activity
app.get('/api/admin/audit', requireAuth, (req, res) => {
  const limit = parseInt(req.query.limit || '100', 10);
  const offset = parseInt(req.query.offset || '0', 10);
  const logs = auditLog.slice().reverse().slice(offset, offset + limit);
  
  return res.json({
    logs,
    total: auditLog.length,
    limit,
    offset
  });
});

// Bulk operations — update multiple records
app.post('/api/admin/bulk-patch', requireAuth, async (req, res) => {
  if (!TABLE_API_BASE) {
    return res.status(500).json({ error: 'TABLE_API_BASE not configured' });
  }
  
  const { table, ids, updates } = req.body;
  if (!table || !Array.isArray(ids) || !updates || !Object.keys(updates).length) {
    return res.status(400).json({ error: 'Missing table, ids, or updates' });
  }
  
  const results = [];
  
  for (const id of ids) {
    const encTable = encodeURIComponent(table);
    const url = `${TABLE_API_BASE}/${encTable}/${encodeURIComponent(id)}`;
    
    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {})
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      
      logAudit(ADMIN_EMAIL, 'BULK_PATCH', table, id, updates);
      
      results.push({
        id,
        status: response.status,
        success: response.ok,
        data
      });
    } catch (error) {
      results.push({
        id,
        status: 500,
        success: false,
        error: error.message
      });
    }
  }
  
  return res.json({
    table,
    total: ids.length,
    successful: results.filter(r => r.success).length,
    results
  });
});

// Search across tables
app.get('/api/admin/search', requireAuth, async (req, res) => {
  const { q, tables } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query required' });
  }
  
  if (!TABLE_API_BASE) {
    return res.status(500).json({ error: 'TABLE_API_BASE not configured' });
  }
  
  const searchTables = tables ? tables.split(',') : ['startups', 'investors', 'events'];
  const results = {};
  const query = q.toLowerCase().trim();
  
  for (const table of searchTables) {
    try {
      const url = `${TABLE_API_BASE}/${encodeURIComponent(table)}?limit=200`;
      const response = await fetch(url, {
        headers: TABLE_API_KEY ? { Authorization: `Bearer ${TABLE_API_KEY}` } : {}
      });
      const data = await response.json();
      const records = data.data || data || [];
      
      // Simple client-side search filter
      results[table] = records.filter(r => {
        const text = JSON.stringify(r).toLowerCase();
        return text.includes(query);
      }).slice(0, 20); // Limit to 20 results per table
    } catch (err) {
      console.error(`Search error for ${table}:`, err);
      results[table] = [];
    }
  }
  
  return res.json({
    query,
    results,
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats — quick overview for admin
app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    const stats = {
      uptime: process.uptime(),
      sessionTimeout: SESSION_TIMEOUT,
      adminUser: ADMIN_EMAIL,
      timestamp: new Date().toISOString(),
      recentActions: auditLog.slice().reverse().slice(0, 10)
    };
    
    return res.json(stats);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Delete record (soft delete via patch with deleted flag)
app.delete('/api/admin/delete/:table/:id', requireAuth, async (req, res) => {
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
      body: JSON.stringify({ deleted: true, deleted_at: new Date().toISOString() })
    });
    const data = await response.json();
    
    logAudit(ADMIN_EMAIL, 'DELETE', decodeURIComponent(table), id, { deleted: true });
    
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Failed to delete record' });
  }
});

app.use(express.static(path.join(__dirname)));

app.listen(port, () => {
  console.log(`AfricaLaunch admin backend running at http://localhost:${port}`);
});
