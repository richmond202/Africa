# 🚀 AfricaLaunch Backend API Documentation

## Overview

The AfricaLaunch backend provides a secure, session-based admin API for managing the entire ecosystem. All endpoints require authentication via session cookie or bearer token.

---

## Authentication

### Session-Based (Default)

1. POST to `/login` with email and password
2. Server sets secure `HttpOnly` session cookie
3. Use cookie for subsequent authenticated requests

### Token-Based (Optional)

Set `ADMIN_ACCESS_METHOD=token` and `ADMIN_API_KEY=<secret>` in `.env`:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3000/api/admin/stats
```

---

## Core Endpoints

### Auth & Session

#### GET `/auth/status`
Check authentication status and admin metadata.

**Response:**
```json
{
  "authenticated": true,
  "name": "AfricaLaunch Admin",
  "role": "superadmin",
  "email": "admin@africalaunch.com",
  "method": "session"
}
```

#### GET `/admin/meta`
Fetch admin metadata (name, role, timeout, email).

**Response:**
```json
{
  "name": "AfricaLaunch Admin",
  "role": "superadmin",
  "email": "admin@africalaunch.com",
  "accessMethod": "session",
  "sessionTimeout": 3600000
}
```

#### POST `/login`
Authenticate with email and password.

**Request:**
```json
{
  "email": "admin@africalaunch.com",
  "password": "LaunchAdminSecure2026!"
}
```

**Response:** Redirect to `/admin` with session cookie

#### GET `/logout`
Destroy session and redirect to login page.

---

## Data Management

### GET `/admin-data/:table`
Fetch records from a table (proxied to TABLE_API_BASE).

**Query Parameters:**
- `limit` (default: 100) — Maximum records to return

**Example:**
```bash
curl -b cookies.txt "http://localhost:3000/admin-data/startups?limit=20"
```

**Response:**
```json
{
  "data": [
    {
      "id": "s1",
      "name": "TechStartup",
      "status": "pending",
      "is_featured": false,
      ...
    }
  ]
}
```

### PATCH `/admin/patch/:table/:id`
Update a single record in the backend.

**Request:**
```json
{
  "status": "approved",
  "is_featured": true
}
```

**Response:**
```json
{
  "id": "s1",
  "status": "approved",
  "is_featured": true,
  "updated_at": "2026-06-19T10:30:00Z"
}
```

**Audit Logged:** ✅ Yes

---

## Analytics & Reporting

### GET `/api/admin/analytics`
Fetch ecosystem analytics (count by status, type, verification).

**Response:**
```json
{
  "timestamp": "2026-06-19T10:30:00Z",
  "analytics": {
    "startups": {
      "total": 150,
      "breakdown": {
        "approved": 120,
        "pending": 25,
        "rejected": 5,
        "featured": 18
      }
    },
    "investors": {
      "total": 45,
      "breakdown": {
        "verified": 40,
        "pending": 5
      }
    },
    "events": {
      "total": 12,
      "breakdown": {
        "upcoming": 3,
        "ongoing": 2,
        "completed": 7
      }
    }
  },
  "auditLogCount": 234
}
```

### GET `/api/admin/stats`
Quick dashboard stats (uptime, recent actions, user info).

**Response:**
```json
{
  "uptime": 3600.5,
  "sessionTimeout": 3600000,
  "adminUser": "admin@africalaunch.com",
  "timestamp": "2026-06-19T10:30:00Z",
  "recentActions": [
    {
      "timestamp": "2026-06-19T10:25:00Z",
      "admin": "admin@africalaunch.com",
      "action": "PATCH",
      "table": "startups",
      "recordId": "s42",
      "changes": { "status": "approved" }
    }
  ]
}
```

---

## Moderation & Bulk Operations

### POST `/api/admin/bulk-patch`
Update multiple records in a single operation.

**Request:**
```json
{
  "table": "startups",
  "ids": ["s1", "s2", "s3"],
  "updates": {
    "status": "approved"
  }
}
```

**Response:**
```json
{
  "table": "startups",
  "total": 3,
  "successful": 3,
  "results": [
    {
      "id": "s1",
      "status": 200,
      "success": true,
      "data": { "id": "s1", "status": "approved", ... }
    },
    ...
  ]
}
```

**Audit Logged:** ✅ Yes (one entry per record)

### DELETE `/api/admin/delete/:table/:id`
Soft-delete a record (marks as deleted).

**Request:** No body required

**Response:**
```json
{
  "id": "s1",
  "deleted": true,
  "deleted_at": "2026-06-19T10:30:00Z"
}
```

**Audit Logged:** ✅ Yes

---

## Search & Discovery

### GET `/api/admin/search`
Search across multiple tables simultaneously.

**Query Parameters:**
- `q` (required) — Search query
- `tables` (optional, default: all) — Comma-separated table names (e.g., `startups,investors`)

**Example:**
```bash
curl -b cookies.txt "http://localhost:3000/api/admin/search?q=techstartup&tables=startups,investors"
```

**Response:**
```json
{
  "query": "techstartup",
  "results": {
    "startups": [
      {
        "id": "s1",
        "name": "TechStartup Inc",
        "status": "pending",
        ...
      }
    ],
    "investors": []
  },
  "timestamp": "2026-06-19T10:30:00Z"
}
```

---

## Audit & Compliance

### GET `/api/admin/audit`
Retrieve audit log of all admin actions.

**Query Parameters:**
- `limit` (default: 100) — Number of log entries to return
- `offset` (default: 0) — Pagination offset

**Response:**
```json
{
  "logs": [
    {
      "id": "audit-1687186200000-abc123",
      "timestamp": "2026-06-19T10:30:00Z",
      "admin": "admin@africalaunch.com",
      "action": "PATCH",
      "table": "startups",
      "recordId": "s42",
      "changes": {
        "status": "approved",
        "is_featured": true
      }
    },
    {
      "id": "audit-1687186195000-def456",
      "timestamp": "2026-06-19T10:29:55Z",
      "admin": "admin@africalaunch.com",
      "action": "BULK_PATCH",
      "table": "investors",
      "recordId": "inv5,inv6,inv7",
      "changes": { "verified": true }
    }
  ],
  "total": 234,
  "limit": 100,
  "offset": 0
}
```

---

## Error Handling

All endpoints return consistent error responses:

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

**Triggers:**
- Missing or expired session cookie
- Invalid bearer token
- Unauthenticated request to protected endpoint

### 400 Bad Request

```json
{
  "error": "Missing table, ids, or updates"
}
```

**Triggers:**
- Malformed request body
- Missing required query/path parameters

### 500 Internal Server Error

```json
{
  "error": "Failed to fetch admin data"
}
```

**Triggers:**
- TABLE_API_BASE not configured
- Network errors proxying to Table API
- Invalid JSON response from Table API

---

## Example Workflows

### Approve Multiple Startups

```bash
# 1. Login
curl -c cookies.txt -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@africalaunch.com","password":"LaunchAdminSecure2026!"}'

# 2. Bulk approve pending startups
curl -b cookies.txt -X POST http://localhost:3000/api/admin/bulk-patch \
  -H "Content-Type: application/json" \
  -d '{
    "table": "startups",
    "ids": ["s1", "s2", "s3"],
    "updates": { "status": "approved" }
  }'

# 3. Check audit log
curl -b cookies.txt "http://localhost:3000/api/admin/audit?limit=20"

# 4. Logout
curl -b cookies.txt http://localhost:3000/logout
```

### Search and Verify Investors

```bash
# Search for investors matching criteria
curl -b cookies.txt "http://localhost:3000/api/admin/search?q=venture&tables=investors"

# Verify specific investor
curl -b cookies.txt -X PATCH http://localhost:3000/admin/patch/investors/inv42 \
  -H "Content-Type: application/json" \
  -d '{"verified": true}'
```

### Monitor Admin Activity

```bash
# Get dashboard stats
curl -b cookies.txt http://localhost:3000/api/admin/stats

# Get full analytics
curl -b cookies.txt http://localhost:3000/api/admin/analytics

# Review recent actions (pagination)
curl -b cookies.txt "http://localhost:3000/api/admin/audit?limit=50&offset=0"
```

---

## Rate Limiting & Performance

- No built-in rate limiting (implement at reverse proxy level for production)
- Audit log capped at 1000 entries in memory (configure in `server.js`)
- Search results limited to 20 records per table
- Bulk operations process sequentially (max 100 records recommended)

---

## Security Best Practices

1. **Always use HTTPS in production** — Set `COOKIE_SECURE=true`
2. **Use bcrypt password hashes** — Set `ADMIN_PASSWORD_HASH`, unset `ADMIN_PASSWORD`
3. **Rotate `SESSION_SECRET`** — Use strong random value (e.g., 32-byte hex)
4. **Token-based auth for APIs** — Use bearer token if automating admin tasks
5. **Monitor audit logs** — Review for suspicious patterns
6. **Set reasonable `SESSION_TIMEOUT`** — Default 1 hour (3600000 ms)
7. **Run behind reverse proxy** — Nginx/CloudFlare for DDoS protection

---

## Deployment Notes

- In development, audit logs are stored in memory
- For production, implement persistent audit log storage (database, S3, etc.)
- Consider session store (Redis, MongoDB) for multi-instance deployments
- Webhook support coming soon for real-time event notifications

---

## Support

For issues or feature requests, contact the AfricaLaunch team.
