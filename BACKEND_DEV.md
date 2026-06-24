# 🛠️ AfricaLaunch Backend Development Guide

## Overview

The AfricaLaunch backend has been expanded with comprehensive admin features including analytics, audit logging, bulk operations, global search, and moderation workflows. This guide covers architecture, implementation, and best practices.

---

## Architecture

### Tech Stack
- **Runtime**: Node.js 14+
- **Framework**: Express.js 4.x
- **Session Management**: express-session (in-memory for dev, Redis recommended for prod)
- **Auth**: Bcrypt for password hashing (optional)
- **HTTP Client**: node-fetch for proxying to Table API

### Directory Structure

```
africa/
├── server.js              # Main Express app with all admin routes
├── admin.html             # Admin UI dashboard (login, moderation, analytics)
├── login.html             # Secure login page
├── js/
│   ├── admin.js           # Admin dashboard logic
│   ├── admin-meta.js      # Metadata helper
│   └── main.js            # General site JS
├── css/
│   └── style.css          # Dark theme styling
├── workers/
│   └── handler.js         # Cloudflare Worker proxy (optional)
├── .env.example           # Configuration template
├── package.json           # Dependencies & scripts
├── wrangler.toml          # Cloudflare config (optional)
├── ADMIN_SETUP.md         # Quick start guide
├── BACKEND_API.md         # Full API documentation
└── README.md              # Main project docs
```

---

## Core Features

### 1. Session-Based Authentication
- Email/password login with bcrypt support
- Secure HttpOnly cookies (httpOnly: true, sameSite: 'lax')
- Configurable session timeout (default: 1 hour)
- Session metadata stored in memory (implement Redis for multi-instance)

### 2. Admin Dashboard
**Tabs & Features:**
- **Moderation Tables** — Approve/reject startups, verify investors, update events
- **Analytics** — Real-time ecosystem statistics (breakdowns by status, type, featured)
- **Audit Log** — Complete admin activity history with pagination
- **Bulk Operations** — Update multiple records in one operation
- **Global Search** — Search across startups, investors, events simultaneously

### 3. Data Proxying
- Transparent proxy to `TABLE_API_BASE` with auth header forwarding
- Supports GET (fetch), PATCH (update), DELETE (soft-delete)
- Error handling and status code passthrough

### 4. Audit Trail
- In-memory audit log (1000 entry cap) — implement database persistence
- Logs all PATCH, BULK_PATCH, DELETE operations
- Includes timestamp, admin email, action type, table, record ID, changes
- Queryable with pagination (limit, offset)

### 5. Analytics
- Real-time counts across tables (startups, investors, events)
- Status breakdowns (approved/pending/rejected/featured for startups, etc.)
- Verification status for investors
- Event status distribution

---

## API Reference Summary

### Authentication
- `GET /auth/status` — Check if authenticated + return metadata
- `GET /admin/meta` — Admin metadata (name, role, timeout)
- `POST /login` — Email/password login
- `GET /logout` — Destroy session

### Data Management
- `GET /admin-data/:table` — Fetch records from table (proxied)
- `PATCH /admin/patch/:table/:id` — Update single record (audited)
- `POST /api/admin/bulk-patch` — Bulk update (audited per record)
- `DELETE /api/admin/delete/:table/:id` — Soft-delete record (audited)

### Analytics & Reporting
- `GET /api/admin/analytics` — Ecosystem statistics
- `GET /api/admin/stats` — Dashboard quick stats
- `GET /api/admin/audit` — Admin activity log (paginated)

### Search
- `GET /api/admin/search?q=...` — Global search across tables

---

## Backend Implementation

### Key Functions (in server.js)

```javascript
// Audit logging
function logAudit(adminEmail, action, table, recordId, changes)

// Authentication middleware
function authenticateRequest(req)  // Supports session and token
function requireAuth(req, res, next)  // Route middleware

// Endpoints
app.post('/login', async (req, res))
app.patch('/admin/patch/:table/:id', requireAuth, async (req, res))
app.post('/api/admin/bulk-patch', requireAuth, async (req, res))
app.get('/api/admin/analytics', requireAuth, async (req, res))
app.get('/api/admin/audit', requireAuth)
app.get('/api/admin/search', requireAuth, async (req, res))
app.get('/api/admin/stats', requireAuth)
app.delete('/api/admin/delete/:table/:id', requireAuth, async (req, res))
```

---

## Frontend Implementation

### Admin Dashboard (js/admin.js)

**Key Functions:**
- `loadAdminData()` — Fetch and render moderation tables
- `loadAnalytics()` — Fetch and display analytics cards
- `loadAuditLog()` — Fetch admin activity history
- `executeBulkPatch()` — Execute bulk update operation
- `performGlobalSearch()` — Search across tables
- `displayAnalytics()` / `displayAuditLog()` / `displaySearchResults()` — Render data

**UI Components:**
- Analytics Grid — Visual KPI cards with counts and breakdowns
- Audit Log Panel — Scrollable table with recent admin actions
- Bulk Ops Panel — JSON-based bulk update interface
- Global Search Panel — Query box + result display

---

## Configuration

### Environment Variables (.env)

```bash
# Required
ADMIN_EMAIL=admin@africalaunch.com
ADMIN_PASSWORD=LaunchAdminSecure2026!        # OR use ADMIN_PASSWORD_HASH
TABLE_API_BASE=https://api.example.com/tables
TABLE_API_KEY=your-api-key

# Optional (admin metadata)
ADMIN_NAME=AfricaLaunch Admin
ADMIN_ROLE=superadmin
ADMIN_ACCESS_METHOD=session                   # or "token"
ADMIN_API_KEY=bearer-token-for-api-access    # if using token method
SESSION_SECRET=replace_with_random_secret
SESSION_TIMEOUT=3600000                       # 1 hour in ms
COOKIE_SECURE=false                           # Set true for HTTPS

# Server
PORT=3000
```

### Production Checklist

- [ ] Use `ADMIN_PASSWORD_HASH` instead of plaintext password
- [ ] Set strong `SESSION_SECRET` (32+ random bytes)
- [ ] Set `COOKIE_SECURE=true` with HTTPS reverse proxy
- [ ] Configure session store (Redis, MongoDB) for multi-instance
- [ ] Implement persistent audit log (database, S3)
- [ ] Set up rate limiting at reverse proxy
- [ ] Enable CORS if serving from different domain
- [ ] Monitor audit logs for suspicious activity
- [ ] Rotate credentials regularly

---

## Development Workflow

### 1. Local Testing

```bash
# Install dependencies
npm install

# Start dev server
npm start
# Server runs at http://localhost:3000

# In another terminal, test endpoints
curl -c cookies.txt -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@africalaunch.com","password":"LaunchAdminSecure2026!"}'

curl -b cookies.txt http://localhost:3000/api/admin/analytics
```

### 2. Adding New Admin Features

**To add a new moderation table:**

1. **Backend (server.js)**:
   - Add table name to analytics fetch loop
   - Add breakdown logic for status/verification fields

2. **Frontend (admin.html)**:
   - Add table section with thead/tbody

3. **Frontend JS (js/admin.js)**:
   - Add `renderNewTable(records)` function
   - Call from `loadAdminData()` 

**To add a new bulk operation:**

1. Use existing `/api/admin/bulk-patch` endpoint
2. Add UI inputs for table, IDs, updates JSON
3. Call `fetch('/api/admin/bulk-patch', { method: 'POST', ... })`

---

## Performance Optimization

### Caching
- Audit log: In-memory (configurable cap, 1000 entries default)
- Analytics: Computed on-demand (consider implementing Redis cache)
- Search: No caching (real-time results)

### Pagination
- Audit log: `limit` + `offset` parameters
- Admin data: `limit` query param (forwarded to Table API)
- Search: Limited to 20 results per table

### Rate Limiting
- Implement at reverse proxy level (Nginx, CloudFlare)
- Suggested: 100 requests/min per authenticated session

---

## Security Best Practices

### Session Management
- HttpOnly & Secure flags enabled
- SameSite: 'lax' to prevent CSRF
- Session timeout: 1 hour (configurable)
- Session data: admin email, name, role only (no passwords)

### Password Security
- Bcrypt hashing with 10 salt rounds
- Never log passwords in audit trail
- Rotate in production

### API Security
- Bearer token support for programmatic access
- Authorization header checked on every request
- TABLE_API_KEY forwarded transparently

### Audit Trail
- All mutations (PATCH, DELETE) logged
- Include admin email, timestamp, record ID, changes
- Review logs weekly for anomalies
- Archive old logs to S3 or database

---

## Troubleshooting

### Issue: "TABLE_API_BASE not configured"
**Cause**: Environment variable not set  
**Fix**: Set `TABLE_API_BASE` in `.env` and restart

### Issue: "Unauthorized" error
**Cause**: Session expired or invalid credentials  
**Fix**: 
- Verify SESSION_SECRET is set consistently
- Check cookie is being sent (curl -b cookies.txt)
- Re-login if session timeout exceeded

### Issue: Bulk operations slow
**Cause**: Sequential PATCH calls to Table API  
**Fix**: 
- Optimize Table API batch endpoint (if available)
- Implement client-side queue with exponential backoff
- Consider time-based bulk limits (max 50 records)

### Issue: Audit log grows too large
**Cause**: In-memory storage with 1000 cap  
**Fix**:
- Implement database persistence (PostgreSQL, MongoDB)
- Archive old logs to S3 monthly
- Adjust `auditLog` cap in `server.js`

---

## Testing

### Unit Tests (Example)
```javascript
// Test auth middleware
describe('requireAuth', () => {
  it('should allow authenticated requests', async () => {
    // Mock authenticated session
  });
  
  it('should reject unauthenticated requests', async () => {
    // Verify 401 response
  });
});

// Test audit logging
describe('logAudit', () => {
  it('should record action in audit log', () => {
    logAudit('admin@example.com', 'PATCH', 'startups', 's1', { status: 'approved' });
    expect(auditLog.length).toBe(1);
  });
});
```

### Integration Tests (Example)
```javascript
// Test login flow
describe('POST /login', () => {
  it('should set session cookie on success', async () => {
    const res = await request(app)
      .post('/login')
      .send({ email: 'admin@africalaunch.com', password: 'LaunchAdminSecure2026!' });
    expect(res.status).toBe(302);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

// Test bulk patch
describe('POST /api/admin/bulk-patch', () => {
  it('should update multiple records', async () => {
    const res = await request(app)
      .post('/api/admin/bulk-patch')
      .set('Cookie', sessionCookie)
      .send({ table: 'startups', ids: ['s1', 's2'], updates: { status: 'approved' } });
    expect(res.status).toBe(200);
    expect(res.body.successful).toBe(2);
  });
});
```

---

## Future Enhancements

- [ ] Real-time notifications (WebSocket)
- [ ] Two-factor authentication
- [ ] Advanced search with filters (date range, regex)
- [ ] Custom dashboard widgets
- [ ] Email notifications for moderation actions
- [ ] Webhook system for external integrations
- [ ] Role-based access control (admin, moderator, viewer)
- [ ] Scheduled tasks (automated cleanup, reports)
- [ ] Database persistence layer (Supabase, Firebase)
- [ ] Admin API rate limiting & quota system

---

## Support & Contributing

For issues, feature requests, or contributions, contact the AfricaLaunch engineering team.

**Key Contacts:**
- Backend Lead: TBD
- DevOps: TBD
- Security: TBD

---

## License

Built for AfricaLaunch. All rights reserved.
