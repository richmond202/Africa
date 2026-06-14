# 🚀 AfricaLaunch — Africa's Premier Startup Showcase Platform

> **The most comprehensive startup ecosystem platform for Africa** — connecting founders, investors, mentors, and ecosystem builders across 54 African countries.

---

## 🌟 Platform Overview

AfricaLaunch is a full-featured static startup showcase platform built with HTML, CSS, and JavaScript, backed by the RESTful Table API for data persistence. It serves as the one-stop hub for Africa's startup ecosystem.

---

## ✅ Completed Features

### 🏠 Homepage (`index.html`)
- Hero section with animated gradient background, live search, and trending tags
- Stats ticker (real-time ecosystem statistics)
- Featured startups grid (loaded from API)
- Awards & Recognition section with Q2 2025 winners
- Upcoming Events preview
- Top Investors spotlight
- Community Leaderboard (podium + table)
- Startup Marketplace preview
- AI-Powered AfrikaBot chat (inline + floating panel)
- Ecosystem Directory summary with 6 categories
- Notifications feed (funding, launches, events, awards)
- Newsletter subscription form
- Multi-language support (EN, FR, AR, PT, SW, HA, AM, ZU)
- Responsive navigation with dropdown menus
- Full footer with social links, page navigation, language flags

### 🚀 Startups (`startups.html`)
- Full startup directory with search, filters, and sorting
- Category filters (FinTech, AgriTech, HealthTech, EdTech, CleanTech, Logistics, AI/ML)
- Sidebar filters: Funding Stage, Country, Status, Awards
- Grid/List view toggle
- Full startup detail modal with funding progress, stats, founder info
- Upvoting system (localStorage-persisted)
- View tracking (API-updated)
- Contact Founder button
- Load more pagination
- URL parameter support (`?id=`, `?cat=`, `?q=`)

### 📝 Submit Startup (`submit.html`)
- **5-step guided submission form:**
  1. Startup Basics (name, tagline, description, category, tags)
  2. Startup Details (location, stage, year, team size, logo)
  3. Founder Information (name, email, LinkedIn, Twitter, pitch deck)
  4. Funding Information (raised, goal, fundraising status)
  5. Review & Submit with live preview
- Live preview panel (real-time card preview as you type)
- Tag input system with chip UI
- Character counters
- Step navigation with animated progress
- Terms of Service agreement
- API submission with success animation

### 📅 Events (`events.html`)
- Full event listing with image cards
- Filters: type tabs (Pitching, Hackathons, Webinars, Networking, Demo Days, Workshops), online-only
- Search bar
- Event status indicators (upcoming/ongoing/completed)
- Attendance progress bars
- Event detail modal with countdown timer + registration
- Real-time registration (API-updated attendee count)
- Submit Your Event form modal

### 🤝 Investors (`investors.html`)
- Full investor directory with search, type filters, sector focus filters
- **AI Investor Matcher** — 3-step quiz (sector → stage → matched results)
- Investor detail modal with bio, stats, investment criteria
- **Pitch Sending System** — send startup pitch directly to investor
- Filter by: Angel, VC, Corporate, Accelerator
- Filter by sector focus

### 📊 Analytics (`analytics.html`)
- **4-tab dashboard:**
  - Overview: KPIs (startups, funding, users, investors), funding chart, sector pie, top lists, country bar chart
  - Startups: featured/approved/pending counts, stage bar chart, team size doughnut
  - Funding: funding vs goal bar chart, goal achievement list, funding by sector
  - Ecosystem: summary stats, growth line chart, top countries by activity
- All charts powered by Chart.js with dark theme
- Dynamic data loaded from Table API

### 🏅 Awards (`awards.html`)
- 4 award categories: Startup of Month, Most Innovative, Fastest Growing, People's Choice
- Current Q2 2025 winners with profiles
- All nominees grid (loaded from API)
- Award history table (Q3 2024 – Q2 2025)
- Community voting system (localStorage-persisted)
- Nomination submission modal
- Animated confetti header

### 🛒 Marketplace (`marketplace.html`)
- Product listing with search and sort
- Category tabs: Templates, SaaS, Courses, Services, Products
- Discount badge, featured badge
- Product detail modal with reviews, features, pricing
- Purchase flow simulation
- List Your Product modal (submits to API)
- Weekly deals promotional banner

### 🏆 Leaderboard (`leaderboard.html`)
- Animated podium (top 3 members)
- Full leaderboard table with rank, avatar, country, level, points bar, badges
- 6 achievement levels: Newcomer → Explorer → Builder → Innovator → Pioneer → Legend
- Points earning guide (6 ways to earn points)
- Join the community CTA

### 🏢 Incubator Hub (`incubator.html`)
- **5-tab content system:**
  - Mentors: Search, filter by expertise, mentor cards with session request
  - Accelerators: 6 top pan-African accelerator listings with equity/funding/deadline info
  - Courses: 6 startup courses with level badges, enrollment
  - Resources: 6 downloadable/premium business resources
  - Guides: 6 startup guides with read time
- Mentor session request form (submitted to messages API)

### 🌍 Ecosystem (`ecosystem.html`)
- 6-category ecosystem directory (Startups, Investors, Mentors, Accelerators, Universities, Services)
- Sidebar with type + country filters
- Dynamic content switching
- Country map grid (12 key African countries with entity counts)
- Static data for Universities (6) and Service Providers (6)
- Dynamic data for Startups, Investors, Mentors from API

---

## 📱 Navigation Structure

| Page | URL | Description |
|------|-----|-------------|
| Home | `index.html` | Main landing page |
| Startups | `startups.html` | Full startup directory |
| Submit Startup | `submit.html` | 5-step submission form |
| Investors | `investors.html` | Investor directory + AI matching |
| Events | `events.html` | Events listing + registration |
| Analytics | `analytics.html` | Ecosystem analytics dashboard |
| Awards | `awards.html` | Recognition & awards |
| Marketplace | `marketplace.html` | Products & services |
| Leaderboard | `leaderboard.html` | Community gamification |
| Incubator Hub | `incubator.html` | Mentors, accelerators, courses |
| Ecosystem | `ecosystem.html` | Full ecosystem directory |

---

## 🔗 URL Parameters

| Parameter | Example | Effect |
|-----------|---------|--------|
| `?id=s1` | `startups.html?id=s1` | Opens startup detail modal |
| `?cat=FinTech` | `startups.html?cat=FinTech` | Pre-filters by category |
| `?q=health` | `startups.html?q=health` | Pre-fills search |
| `?tab=mentors` | `incubator.html?tab=mentors` | Opens specific tab |
| `?type=investors` | `ecosystem.html?type=investors` | Shows investor type |

---

## 🗄️ Data Models

### Table: `startups`
Fields: id, name, tagline, description, category, stage, country, city, founded_year, team_size, website, logo_url, founder_name, founder_email, founder_linkedin, funding_raised, funding_goal, revenue, users_count, status, views, votes, tags, social_twitter, social_linkedin, pitch_deck_url, screenshot_urls, award, is_featured, points

### Table: `investors`
Fields: id, name, company, bio, investment_focus, investment_stage, min_investment, max_investment, portfolio_count, country, linkedin, email, avatar_url, verified, type, total_invested, website

### Table: `events`
Fields: id, title, description, type, date, end_date, location, is_online, organizer, prize_pool, registration_url, image_url, attendees, max_attendees, status, tags, country

### Table: `messages`
Fields: id, user_name, startup_id, investor_id, message, type, status, email

### Table: `mentors`
Fields: id, name, expertise, bio, company, title, country, linkedin, avatar_url, mentorship_type, availability, rating, sessions_count, verified

### Table: `marketplace`
Fields: id, startup_id, startup_name, product_name, description, price, currency, category, type, image_url, discount, featured, purchase_url, rating, reviews_count

### Table: `leaderboard`
Fields: id, user_name, avatar_url, points, badges, rank, startups_submitted, votes_cast, events_attended, referrals, country, joined_date, level

---

## 🎨 Design System

- **Primary**: `#7c3aed` (Purple)
- **Secondary**: `#f59e0b` (Amber)
- **Accent**: `#16a34a` (Green)
- **Background**: `#0a0a0f` (Near Black)
- **Font**: Inter (body) + Plus Jakarta Sans (display)
- **Icons**: Font Awesome 6.4
- **Charts**: Chart.js with dark theme
- **Responsive**: Mobile-first, 3 breakpoints (1024px, 768px, 480px)

---

## 🤖 AI Features

### AfrikaBot (Client-side AI Simulation)
- Responds to 11+ topic categories (sectors, funding, events, validation, pitch, etc.)
- Available as: inline demo section + floating FAB panel
- Accessible from all pages via floating button
- Smart keyword matching with contextual responses

---

## 🚀 Deployment

To make this website live, go to the **Publish tab** and click publish. All files are ready for production.

## 🔐 Admin Backend (Local)

This repo includes a small Node/Express admin backend (`server.js`) that provides server-side authentication and a protected proxy for the Table API used by the admin console.

Quick start:

1. Copy `.env.example` to `.env` and set `TABLE_API_BASE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET`.
   Add optional values for `ADMIN_NAME`, `ADMIN_ROLE`, `ADMIN_ACCESS_METHOD`, and `SESSION_TIMEOUT` if you want custom metadata and session lifetime.
2. Install dependencies and start the server:

```powershell
cd path\to\africa
npm install
npm start
```

3. Visit `http://localhost:3000/login` to sign in and access the Admin Console at `/admin`.

Notes:
- The admin console (`admin.html`) is protected by a server-side session cookie.
- Admin metadata is now exposed to the dashboard and includes name, role, access method, and timeout.
- Admin actions (approve/reject/feature/verify) are forwarded by the server to the configured `TABLE_API_BASE`.
- For production, secure `SESSION_SECRET`, and run the server behind HTTPS.
- Optional: instead of storing a plaintext password in `.env`, you can store a bcrypt hash in `ADMIN_PASSWORD_HASH`.
  To generate a hash locally (Node.js):

```powershell
node -e "console.log(require('bcrypt').hashSync(process.env.ADMIN_PASSWORD || 'LaunchAdmin2026!', 10))"
```
Paste the resulting string into `.env` as `ADMIN_PASSWORD_HASH` and remove `ADMIN_PASSWORD` for better security.

## ☁️ Deploying the API proxy with Wrangler (optional)

You can deploy a lightweight proxy to your Table API using Cloudflare Workers and `wrangler`.

1. Install wrangler (globally or dev):

```powershell
npm install -g wrangler
# or as devDependency
npm install --save-dev @cloudflare/wrangler
```

2. Configure `wrangler.toml` (already included) with your `account_id` and set `TABLE_API_BASE` in the worker variables or secrets.

3. Publish:

```powershell
npm run deploy:wrangler
# or: wrangler publish
```

Notes:
- The repository includes `workers/handler.js` as a minimal proxy for `/tables/*` endpoints.
- Using Wrangler and Workers keeps serverless traffic at the edge; choose whether to keep the Node server for session-backed admin flows or implement auth inside Workers (requires different session strategy).

---

## 📋 Features Not Yet Implemented (Future Roadmap)

- [ ] User authentication & profiles
- [ ] Real-time messaging between founders & investors
- [ ] Push notifications system
- [ ] Mobile app (Android/iOS)
- [ ] Real AI API integration (Claude/GPT)
- [ ] Two-factor authentication
- [ ] Startup growth tracking charts (per-startup)
- [ ] Media center (podcasts, interviews, press releases)
- [ ] Community forums / discussion boards
- [ ] Crowdfunding/investment module
- [ ] Advanced admin moderation dashboard
- [ ] Email notification system
- [ ] Referral reward tracking
- [ ] Sponsored/premium listings payment
- [ ] Video pitch embedding

### Admin Console
- `admin.html` — client-side admin dashboard for backend moderation of startups, events, and investors
- Demo admin login with local browser session support
- Backend PATCH updates to `tables/startups`, `tables/events`, and `tables/investors`

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Custom CSS with CSS Variables (dark theme)
- **Charts**: Chart.js 4.x
- **Icons**: Font Awesome 6.4
- **Fonts**: Google Fonts (Inter, Plus Jakarta Sans)
- **Data**: AfricaLaunch RESTful Table API (7 tables)
- **No build tools required** — pure static files

---

*Built with ❤️ for Africa's entrepreneurs — AfricaLaunch 2025*
