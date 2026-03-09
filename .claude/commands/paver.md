Guide for installing, configuring, and using Paver — a local business discovery and preview site generation platform for web design agency outreach.

# Paver Setup and Usage Guide

Paver scans geographic areas via the Google Places API, identifies businesses without professional websites, auto-generates preview sites from real business data, and deploys them to Cloudflare Pages. It is built for web design agencies, freelancers, and anyone doing local business outreach.

**Ports:** Dashboard runs on **4502**, Backend API on **4501** (Docker). In local dev mode, backend is on 4500 and dashboard on 3001.

---

## 1. Installation Walkthrough

### Clone and configure

```bash
git clone https://github.com/calrunsIT/paverv2.git
cd paver
cp .env.example .env
```

Edit `.env` and fill in at minimum:

- `PAVER_API_KEY` — internal auth key shared between dashboard and backend
- `GOOGLE_PLACES_API_KEY` — required for scanning businesses

Generate a Paver API key:

```bash
cd backend && npm run generate-key
```

This outputs a key in the format `pvr_[32hex]`. Paste it into `PAVER_API_KEY` in `.env`.

### Start with Docker

```bash
docker compose up --build
```

The SQLite database is auto-created on first run at `data/paver.db`. Previews are stored in `data/previews/`.

Once running:

- Dashboard: http://localhost:4502
- Backend API: http://localhost:4501
- Health check: http://localhost:4501/health

---

## 2. API Key Setup

### Google Places API

1. Go to https://console.cloud.google.com/
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services > Library**
4. Search for and enable **Places API (New)** — use the newer version, not the legacy "Places API"
5. Go to **APIs & Services > Credentials**
6. Click **Create Credentials > API Key**
7. (Recommended) Click the key and restrict it to "Places API (New)" only
8. Copy the key into `GOOGLE_PLACES_API_KEY` in your `.env`

Pricing note: Google provides $200/month in free credit. A typical scan of ~100 businesses costs roughly $1-3.

### Cloudflare Pages (optional — needed only for deploying live preview URLs)

1. Sign up at https://dash.cloudflare.com/sign-up (free tier works)
2. Note your **Account ID** from the dashboard sidebar
3. Go to **My Profile > API Tokens > Create Token**
4. Use the **Edit Cloudflare Pages** template, or create a custom token with:
   - Permissions: Account > Cloudflare Pages > Edit
   - Account Resources: Include your account
5. Copy the token and account ID into `.env`:

```
CF_API_TOKEN=your_token_here
CF_ACCOUNT_ID=your_account_id_here
CF_PROJECT_NAME=paver
```

The Cloudflare Pages project is auto-created on first deploy.

### Branding (optional)

Configure what appears on generated preview sites:

```
COMPANY_NAME=Your Agency
COMPANY_PHONE=(555) 123-4567
COMPANY_EMAIL=hello@youragency.com
COMPANY_WEBSITE=youragency.com
COMPANY_BOOKING_URL=https://calendly.com/youragency
SITE_PRICE=$499
SITE_DESCRIPTION=One-time setup • Includes 1 year of hosting • Custom design
```

---

## 3. Running Your First Scan

### From the Dashboard

1. Open http://localhost:4502
2. Navigate to the **Scan Management** page
3. Enter a location (e.g., "Bartow County, GA") and a radius in meters (default 5000, max 50000)
4. Click **Start Scan**
5. Paver searches 20+ business type groups automatically: food & drink, beauty, home services, automotive, healthcare, retail, professional services, fitness, houses of worship, education, lodging, pets, and more

### From the API

```bash
curl -X POST http://localhost:4501/api/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PAVER_API_KEY" \
  -d '{"area": "Bartow County, GA", "radius": 5000}'
```

You can also pass coordinates directly:

```bash
curl -X POST http://localhost:4501/api/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PAVER_API_KEY" \
  -d '{"lat": 34.19, "lng": -84.84, "radius": 10000}'
```

Check scan history:

```bash
curl http://localhost:4501/api/scans \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

After scanning, each business is automatically assessed for website quality (none, facebook_only, poor, decent) and emails/social profiles are extracted from their site HTML.

---

## 4. Generating Previews

### From the Dashboard

1. Open the **Dashboard** page at http://localhost:4502
2. Browse the business table — filter by website quality (e.g., "none" or "poor") to find good prospects
3. Click on a business to open its detail page
4. Click **Generate Preview** to create a one-click preview site
5. The preview opens in a new tab at `http://localhost:4501/previews/{slug}/index.html`

Paver auto-selects one of 15 templates based on business category:

- **Restaurant** — restaurants, cafes, bars, bakeries (warm oranges/reds)
- **Contractor** — plumbers, electricians, roofers, landscapers (professional blues)
- **Beauty** — salons, spas, barbers (rose/pink)
- **Healthcare** — dentists, doctors, pharmacies (medical green)
- **Automotive** — repair shops, dealerships, car washes (dark amber)
- **Retail** — clothing, hardware, electronics stores (vibrant purple)
- **Professional** — accountants, lawyers, real estate (sky blue)
- **Fitness** — gyms, sports clubs (bold red/orange)
- **Church** — churches, mosques, synagogues, temples (deep indigo)
- **Pets** — pet stores, veterinary clinics (lime green)
- **Lodging** — hotels, campgrounds, B&Bs (teal/cyan)
- **Education** — schools, libraries, museums (classic blue)
- **Events** — florists, funeral homes (fuchsia/purple)
- **Cleaning** — laundry, dry cleaning, tailors (fresh sky blue)
- **Generic** — everything else (modern purple)

### Batch Generation

From the Dashboard page, select multiple businesses using checkboxes and click the batch generate action. Maximum 50 at a time.

Via API:

```bash
curl -X POST http://localhost:4501/api/businesses/batch-generate-preview \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PAVER_API_KEY" \
  -d '{"businessIds": ["id1", "id2", "id3"]}'
```

### Single business preview via API

```bash
curl -X POST http://localhost:4501/api/businesses/BUSINESS_ID/generate-preview \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

### Delete a preview

```bash
curl -X DELETE http://localhost:4501/api/businesses/BUSINESS_ID/preview \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

---

## 5. Deploying to Cloudflare Pages

Requires `CF_API_TOKEN`, `CF_ACCOUNT_ID`, and `CF_PROJECT_NAME` in `.env`.

### From the Dashboard

1. On a business detail page, after a preview is generated, click **Deploy**
2. The preview is pushed to Cloudflare Pages
3. The live URL follows the pattern: `https://your-project.pages.dev/business-slug/`

### Via API

```bash
curl -X POST http://localhost:4501/api/deploy \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PAVER_API_KEY" \
  -d '{"businessIds": ["id1", "id2"]}'
```

Maximum 50 businesses per deploy. The Cloudflare Pages project is auto-created on first deploy if it does not already exist.

---

## 6. Common Tasks

### Check stats

```bash
curl http://localhost:4501/api/stats \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

The Dashboard page also shows stat cards and a website quality breakdown bar at the top.

### Filter businesses

```bash
# Businesses with no website
curl "http://localhost:4501/api/businesses?websiteQuality=none" \
  -H "X-API-Key: YOUR_PAVER_API_KEY"

# Businesses with poor websites
curl "http://localhost:4501/api/businesses?websiteQuality=poor" \
  -H "X-API-Key: YOUR_PAVER_API_KEY"

# Search by name
curl "http://localhost:4501/api/businesses?search=joes+plumbing" \
  -H "X-API-Key: YOUR_PAVER_API_KEY"

# Filter by status
curl "http://localhost:4501/api/businesses?status=preview_generated" \
  -H "X-API-Key: YOUR_PAVER_API_KEY"

# Paginate results
curl "http://localhost:4501/api/businesses?limit=20&offset=40" \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

Available query params: `status`, `hasWebsite`, `county`, `websiteQuality`, `limit`, `offset`, `search`, `sort`.

### Manage the outreach pipeline

The status pipeline is: `discovered` > `preview_generated` > `approved` > `emailed` > `responded` > `converted` (or `skipped` at any point).

Update a business status:

```bash
curl -X PATCH http://localhost:4501/api/businesses/BUSINESS_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PAVER_API_KEY" \
  -d '{"status": "emailed"}'
```

Approve a business:

```bash
curl -X POST http://localhost:4501/api/businesses/BUSINESS_ID/approve \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

Add notes or update email:

```bash
curl -X PATCH http://localhost:4501/api/businesses/BUSINESS_ID \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_PAVER_API_KEY" \
  -d '{"email": "owner@business.com", "notes": "Spoke on phone, interested"}'
```

### Reset the database

WARNING: This deletes all businesses, scans, and preview files with no undo.

```bash
curl -X POST http://localhost:4501/api/stats/reset \
  -H "X-API-Key: YOUR_PAVER_API_KEY"
```

---

## 7. Development Setup (Without Docker)

### Backend

```bash
cd backend
npm install
cp ../.env .env
npm run db:push          # initialize SQLite database
npm run dev              # starts on http://localhost:4500
```

### Dashboard (separate terminal)

```bash
cd dashboard
npm install
npm run dev              # starts on http://localhost:3001
```

### Useful dev commands

```bash
# Backend
npm run db:generate      # regenerate Prisma client after schema changes
npm run db:push          # push schema changes to SQLite
npm run db:studio        # open Prisma Studio visual DB browser
npm run generate-key     # generate a new API key
npm run build            # compile TypeScript

# Dashboard
npm run dev:client       # Vite dev server only (hot reload)
npm run dev:server       # Express proxy server only
npm run dev              # both concurrently
npm run build            # production build
```

Notes:
- ES modules throughout (type: module)
- Backend uses Zod for request validation
- Dashboard proxy forwards `/api/*` and `/previews/*` to the backend
- Dashboard also does direct SQLite reads (via better-sqlite3) for some UI queries
- Dark theme UI with Tailwind CSS

---

## 8. Troubleshooting

### API key errors ("Unauthorized" or 401 responses)

- Verify `PAVER_API_KEY` is set in `.env` and matches between backend and dashboard
- When calling the API directly, include the header: `-H "X-API-Key: YOUR_KEY"`
- Key format should be `pvr_[32hex]` — regenerate with `cd backend && npm run generate-key`

### Empty scans (no businesses found)

- Confirm `GOOGLE_PLACES_API_KEY` is set and valid
- Make sure **Places API (New)** is enabled in Google Cloud Console (not the legacy "Places API")
- Check that the API key is not restricted to wrong IPs or referrers
- Try a well-known location with a larger radius (e.g., `"area": "Atlanta, GA", "radius": 10000`)
- Check backend logs: `docker compose logs backend`

### Preview not loading or showing blank page

- Ensure the preview file exists in `data/previews/` — each preview is a directory with an `index.html`
- In Docker, the `data/previews` directory is mounted as a volume; verify the mount in `docker-compose.yml`
- Try accessing the preview directly: `http://localhost:4501/previews/{slug}/index.html`
- The `/previews/*` route requires no authentication, so 401 errors indicate you are hitting `/api/*` instead

### Cloudflare deploy fails

- Verify `CF_API_TOKEN`, `CF_ACCOUNT_ID`, and `CF_PROJECT_NAME` are all set in `.env`
- The API token needs **Account > Cloudflare Pages > Edit** permission
- On first deploy, the Pages project is created automatically — if it fails, check that your token has account-level access
- Check backend logs for specific Cloudflare API error messages

### Database issues

- The SQLite database is at `data/paver.db` and is auto-created on first run
- If the schema is outdated after pulling new code: `cd backend && npm run db:push`
- To start completely fresh: `curl -X POST http://localhost:4501/api/stats/reset -H "X-API-Key: YOUR_KEY"`
- For manual inspection: `cd backend && npm run db:studio` opens Prisma Studio

### Docker issues

- Rebuild after code changes: `docker compose up --build`
- View logs: `docker compose logs -f` (or `docker compose logs backend` / `docker compose logs dashboard`)
- Ports 4501 and 4502 must be free — check with `lsof -i :4501` and `lsof -i :4502`
- If containers exit immediately, check for missing required env vars in `.env`

---

## Key File Locations

| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Express server entry point |
| `backend/src/routes/scan.ts` | Scan API endpoints |
| `backend/src/routes/business.ts` | Business CRUD endpoints |
| `backend/src/routes/stats.ts` | Stats and reset endpoints |
| `backend/src/routes/deploy.ts` | Cloudflare deploy endpoint |
| `backend/src/services/googlePlaces.ts` | Google Places API integration |
| `backend/src/services/previewGenerator.ts` | HTML preview generation (15 templates) |
| `backend/src/services/websiteQuality.ts` | Website analysis + email/social extraction |
| `backend/src/services/cloudflarePages.ts` | Cloudflare Pages deployment |
| `backend/prisma/schema.prisma` | Database schema |
| `dashboard/client/src/pages/Dashboard.jsx` | Main business list view |
| `dashboard/client/src/pages/BusinessDetail.jsx` | Single business detail + outreach |
| `dashboard/client/src/pages/ScanManagement.jsx` | Scan trigger and history |
| `backend/templates/email/` | Email templates (initial, 3-day, 7-day follow-up) |
