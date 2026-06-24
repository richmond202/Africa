# 🔐 AfricaLaunch Admin Backend Setup & Testing Guide

This guide walks you through setting up and testing the admin backend (`server.js`) locally.

## Prerequisites

- Node.js 14+ and npm installed
- `.env` file configured (copy from `.env.example`)

## Quick Start

### 1. Configure Environment

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `TABLE_API_BASE` — Your Table API endpoint (e.g., `https://api.example.com/tables`)
- `TABLE_API_KEY` — API key for the Table API
- `ADMIN_EMAIL` — Admin email (default: `admin@africalaunch.com`)
- `ADMIN_PASSWORD` — Admin password (default: `LaunchAdminSecure2026!`)
- `SESSION_SECRET` — Random secret for session signing (e.g., `my-super-secret-key-123`)
- `SESSION_TIMEOUT` — Session lifetime in milliseconds (default: `3600000` = 1 hour)
- `PORT` — Server port (default: `3000`)

**Optional for production:**
- `ADMIN_PASSWORD_HASH` — Bcrypt hash of admin password (see section below)
- `COOKIE_SECURE=true` — Enable only with HTTPS
- `ADMIN_NAME` — Display name (default: `AfricaLaunch Admin`)
- `ADMIN_ROLE` — Role display (default: `superadmin`)
- `ADMIN_ACCESS_METHOD` — `session` or `token` (default: `session`)
- `ADMIN_API_KEY` — Bearer token for programmatic access (only if `ADMIN_ACCESS_METHOD=token`)

### 2. Install Dependencies

```bash
npm install
```

This installs:
- `express` — HTTP server framework
- `express-session` — Session management
- `bcrypt` — Password hashing (optional)
- `dotenv` — Environment config
- `node-fetch` — HTTP client for proxying

### 3. Start the Server

```bash
npm start
```

You should see:
```
AfricaLaunch admin backend running at http://localhost:3000
```

The server is now ready for login and admin requests.

---

## Testing the Admin Backend

### Test 1: Check Auth Status (Unauthenticated)

```bash
curl -i http://localhost:3000/auth/status
```

**Expected:** `401 Unauthorized` (JSON error)

```json
{ "error": "Unauthorized" }
```

### Test 2: Login

Use a cookie jar to persist the session:

```bash
# On Windows PowerShell
curl -c cookies.txt -b cookies.txt -X POST http://localhost:3000/login `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@africalaunch.com","password":"LaunchAdminSecure2026!"}'
```

**Expected:** Redirect to `/admin` (HTTP 302) or JSON success.

### Test 3: Check Auth Status (Authenticated)

```bash
curl -b cookies.txt http://localhost:3000/auth/status
```

**Expected:** `200 OK` with admin metadata:

```json
{
  "authenticated": true,
  "name": "AfricaLaunch Admin",
  "role": "superadmin",
  "email": "admin@africalaunch.com",
  "method": "session"
}
```

### Test 4: Fetch Admin Data

```bash
curl -b cookies.txt "http://localhost:3000/admin-data/startups?limit=5"
```

**Expected:** `200 OK` with data from `TABLE_API_BASE/startups?limit=5`, or `500 error` if `TABLE_API_BASE` is not configured.

### Test 5: Get Admin Metadata

```bash
curl -b cookies.txt http://localhost:3000/admin/meta
```

**Expected:** `200 OK` with:

```json
{
  "name": "AfricaLaunch Admin",
  "role": "superadmin",
  "email": "admin@africalaunch.com",
  "accessMethod": "session",
  "sessionTimeout": 3600000
}
```

### Test 6: Update a Record (PATCH)

```bash
curl -b cookies.txt -X PATCH http://localhost:3000/admin/patch/startups/s1 `
  -H "Content-Type: application/json" `
  -d '{"status":"approved"}'
```

**Expected:** Proxied PATCH response from `TABLE_API_BASE/startups/s1`.

### Test 7: Logout

```bash
curl -b cookies.txt http://localhost:3000/logout
```

**Expected:** Redirect to `/login` (HTTP 302).

### Test 8: Verify Session Expired

```bash
curl -b cookies.txt http://localhost:3000/auth/status
```

**Expected:** `401 Unauthorized` (session cookie was destroyed).

---

## Password Hashing (For Production)

Instead of storing a plaintext password, use a bcrypt hash:

### Generate a Bcrypt Hash

```bash
node -e "console.log(require('bcrypt').hashSync('LaunchAdminSecure2026!', 10))"
```

This outputs something like:
```
$2b$10$abcdef1234567890...
```

### Use the Hash in `.env`

1. Copy the hash.
2. Edit `.env` and set:
   ```
   ADMIN_PASSWORD_HASH=$2b$10$abcdef1234567890...
   ADMIN_PASSWORD=
   ```
3. Restart the server. The server now uses bcrypt to validate the password.

---

## Browser Testing

1. Open `http://localhost:3000/login` in your browser.
2. Enter:
   - **Email:** `admin@africalaunch.com`
   - **Password:** `LaunchAdminSecure2026!`
3. Click **Sign in**.
4. You'll be redirected to `http://localhost:3000/admin`.
5. The admin dashboard loads and displays:
   - **Admin Info** (name, role, timeout)
   - **KPI Cards** (startup count, pending, investors, events) — if `TABLE_API_BASE` is set
   - **Moderation Tables** (Startup, Event, Investor) — if data is available from the API
6. Click **Refresh Data** to reload tables.
7. Click **Log out** to end the session.

---

## Troubleshooting

### Error: `TABLE_API_BASE not configured`

**Cause:** The `.env` file doesn't have `TABLE_API_BASE` set.

**Fix:**
```bash
# Edit .env and set TABLE_API_BASE
TABLE_API_BASE=https://your-api.example.com/tables
```

### Error: `isAuthenticated is not defined` or similar

**Cause:** Outdated server code.

**Fix:** Ensure `server.js` uses `authenticateRequest(req)` instead of `isAuthenticated(req)`.

### Session Not Persisting in Curl

**Cause:** Cookie jar not being used between requests.

**Fix:** Use `-c cookies.txt` (write cookies) and `-b cookies.txt` (read cookies) in all curl commands.

### HTTPS Cookie Not Working

**Cause:** Cookie `secure` flag is set but connection is HTTP.

**Fix:** Use `COOKIE_SECURE=false` for local development, or run server behind HTTPS in production.

---

## Production Deployment

1. Set strong `SESSION_SECRET` (e.g., generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`).
2. Use `ADMIN_PASSWORD_HASH` instead of plaintext password.
3. Set `COOKIE_SECURE=true` and run server behind HTTPS proxy (e.g., Nginx, CloudFlare).
4. Use a production session store (e.g., Redis) instead of memory.
5. Keep `.env` out of version control.

---

## Deployment with Wrangler (Optional)

If you want to deploy the API proxy to Cloudflare Workers:

```bash
npm run deploy:wrangler
```

See `wrangler.toml` for configuration.

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login` | GET | — | Login page (`login.html`) |
| `/login` | POST | — | Submit login credentials |
| `/logout` | GET | ✓ | Destroy session and redirect |
| `/auth/status` | GET | ✓ | Check auth status + metadata |
| `/admin` | GET | ✓ | Admin dashboard (`admin.html`) |
| `/admin/meta` | GET | ✓ | Admin metadata (name, role, timeout) |
| `/admin-data/:table` | GET | ✓ | Proxy: fetch `TABLE_API_BASE/:table` |
| `/admin/patch/:table/:id` | PATCH | ✓ | Proxy: update record in `TABLE_API_BASE/:table/:id` |

---

## Questions?

For more info, see the main [README.md](README.md).
