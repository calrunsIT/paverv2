<p align="center">
  <img src="https://img.shields.io/badge/node-20+-339933?logo=node.js&logoColor=white" alt="Node 20+">
  <img src="https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/react-18-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

<h1 align="center">🛤️ Paver</h1>

<p align="center">
  <strong>Find local businesses without websites. Generate preview sites. Close deals.</strong>
</p>

<p align="center">
  Paver scans geographic areas via the Google Places API, identifies businesses without professional websites,<br>
  auto-generates beautiful preview sites from real data, and deploys them to Cloudflare Pages — all from one dashboard.
</p>

<p align="center">
  Built for web design agencies, freelancers, and anyone doing local business outreach.
</p>

---

## ⚡ Quick Start

```bash
git clone https://github.com/YOUR_USER/paver.git
cd paver
cp .env.example .env
# Edit .env with your API keys (see Configuration below)
docker compose up --build
```

🖥️ Dashboard: **http://localhost:4502** · 🔌 API: **http://localhost:4501**

The database is created automatically on first run.

---

## 🔄 How It Works

```
📍 Scan Area  →  🔍 Discover Businesses  →  📊 Assess Websites  →  🎨 Generate Previews  →  🚀 Deploy & Outreach
```

1. **🔍 Scan** — enter a location (e.g. "Bartow County, GA") and radius. Paver searches Google Places across 20+ business type groups
2. **📊 Assess** — each business gets a website quality rating and emails/socials are extracted automatically
3. **🎨 Generate** — one-click preview sites built from real business data (hours, reviews, maps, photos)
4. **🚀 Deploy** — push previews to Cloudflare Pages for shareable live URLs
5. **📧 Track** — manage the full outreach pipeline from discovery to conversion

---

## ✨ Features

### 🔍 Smart Scanning

Enter any location and Paver searches **20+ business type groups** automatically:

| | Category | Google Places Types |
|--|----------|---------------------|
| 🍽️ | Food & Drink | restaurant, cafe, bar, bakery, meal_delivery, meal_takeaway, liquor_store |
| 💇 | Beauty & Personal Care | hair_care, beauty_salon, spa |
| 🔧 | Home Services | electrician, plumber, roofing_contractor, painter, locksmith, moving_company |
| 🚗 | Automotive | car_dealer, car_repair, car_wash, gas_station |
| 🏥 | Healthcare | dentist, doctor, veterinary_care, pharmacy, physiotherapist, hospital |
| 🛍️ | Retail | clothing_store, hardware_store, furniture_store, pet_store, jewelry_store, electronics_store, book_store, shoe_store, bicycle_store, convenience_store |
| 💼 | Professional Services | accounting, lawyer, insurance_agency, real_estate_agency, travel_agency, finance |
| 🏋️ | Fitness | gym |
| ⛪ | Houses of Worship | church, mosque, synagogue, hindu_temple |
| 🎓 | Education & Culture | school, library, museum |
| 🏨 | Lodging | lodging, campground, rv_park |
| 🐾 | Pets | pet_store, veterinary_care |
| 🌸 | Other Services | laundry, funeral_home, cemetery, florist, bank, post_office |

Results are deduplicated by Google Place ID, with website quality assessed and contact info extracted automatically.

### 📊 Website Quality Assessment

Every discovered business gets an automatic rating:

| Rating | Meaning |
|--------|---------|
| 🔴 `none` | No website listed on Google |
| 🟠 `facebook_only` | Only has a Facebook/Instagram page |
| 🟡 `poor` | Broken, parked, under construction, or placeholder page |
| 🟢 `decent` | Functional website with real business content |

Detection checks for: "coming soon", "under construction", "parked domain", domain seller pages, missing HTTPS, and lack of business content keywords.

During assessment, Paver also extracts **email addresses**, **Facebook pages**, and **Instagram profiles** from site HTML.

### 🎨 Preview Generation

One-click generates professional preview sites using **15 auto-selected templates**:

| Template | Used For | Theme |
|----------|----------|-------|
| 🍽️ Restaurant | Restaurants, cafes, bars, bakeries | Warm oranges & reds |
| 🔧 Contractor | Plumbers, electricians, roofers, landscapers, locksmiths | Professional blues |
| 💇 Beauty | Salons, spas, barbers, nail studios | Rose & pink |
| 🏥 Healthcare | Dentists, doctors, pharmacies, hospitals | Medical green |
| 🚗 Automotive | Repair shops, dealerships, car washes | Dark amber |
| 🛍️ Retail | Clothing, furniture, hardware, electronics stores | Vibrant purple |
| 💼 Professional | Accountants, lawyers, real estate, insurance | Sky blue |
| 🏋️ Fitness | Gyms, sports clubs, studios | Bold red & orange |
| ⛪ Church | Churches, mosques, synagogues, temples | Deep indigo |
| 🐾 Pets | Pet stores, veterinary clinics | Lime green |
| 🏨 Lodging | Hotels, motels, campgrounds, B&Bs | Teal & cyan |
| 🎓 Education | Schools, libraries, museums | Classic blue |
| 🌸 Events | Florists, funeral homes | Fuchsia & purple |
| 🧹 Cleaning | Laundry, dry cleaning, tailors | Fresh sky blue |
| 🏢 Generic | Everything else | Modern purple |

Each preview includes:
- ✅ Hero section with business name, rating, and click-to-call
- ✅ Auto-generated "About" and "What We Offer" sections
- ✅ Google reviews (up to 3) with star ratings
- ✅ Hours table with today highlighted
- ✅ Embedded Google Map
- ✅ Your branded CTA with pricing, phone, email, and booking link

### 🚀 One-Click Deployment

Deploy previews to **Cloudflare Pages** and get instant live URLs:

```
https://your-project.pages.dev/joes-plumbing/
```

Share these with prospects to show them exactly what you can build. The CF Pages project is auto-created on first deploy.

### 📋 Dashboard

**Three pages** to manage your entire pipeline:

| Page | What It Does |
|------|-------------|
| 📊 **Dashboard** | Stats cards, quality breakdown bar, filterable business table, batch actions |
| 👤 **Business Detail** | Full info, status pipeline, preview management, outreach notes |
| 🔍 **Scan Management** | Trigger scans, view history, reset database |

### 📈 Status Pipeline

Track every business through your outreach workflow:

```
discovered → preview_generated → approved → emailed → responded → converted
                                                                  ↘ skipped
```

### 📧 Email Templates

Three starter templates included (`backend/templates/email/`):

| Template | Purpose |
|----------|---------|
| 📨 `initial.html` | First contact — introduces the preview site |
| 🔔 `followup-3day.html` | 3-day follow-up |
| 👋 `followup-7day.html` | Final follow-up |

> **Note:** Templates are **not** auto-sent. They're starting points for your own email workflow (Mailgun, SES, etc.). Customize branding and CAN-SPAM footer before use.

---

## ⚙️ Configuration

### 🔑 Required

| Variable | Description |
|----------|-------------|
| `PAVER_API_KEY` | Internal auth key. Generate: `cd backend && npm run generate-key` |
| `GOOGLE_PLACES_API_KEY` | Google Places API key ([setup guide](#-google-places-api)) |

### ☁️ Cloudflare Pages (optional)

| Variable | Description |
|----------|-------------|
| `CF_API_TOKEN` | Cloudflare API token with Pages edit permissions |
| `CF_ACCOUNT_ID` | Your Cloudflare account ID |
| `CF_PROJECT_NAME` | Pages project name (default: `paver`) |

### 🏷️ Branding

Shown on generated preview sites (CTA section and footer):

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPANY_NAME` | `Paver` | Your company/agency name |
| `COMPANY_PHONE` | `(555) 000-0000` | Contact phone number |
| `COMPANY_EMAIL` | `hello@example.com` | Contact email |
| `COMPANY_WEBSITE` | | Your website URL |
| `COMPANY_BOOKING_URL` | | Booking link (omitted if empty) |
| `SITE_PRICE` | `$499` | Price shown on preview CTA |
| `SITE_DESCRIPTION` | `One-time setup...` | Tagline under the price |

---

## 🗝️ Getting Your API Keys

### 🗺️ Google Places API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Navigate to **APIs & Services → Library**
4. Search for and enable **Places API (New)** — the newer version, not "Places API"
5. Go to **APIs & Services → Credentials**
6. Click **Create Credentials → API Key**
7. *(Recommended)* Restrict the key to "Places API (New)" only
8. Copy into `GOOGLE_PLACES_API_KEY` in `.env`

> 💰 **Pricing:** Google gives **$200/month free credit**. A typical scan of ~100 businesses costs roughly **$1–3**. See [Google's pricing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing).

### ☁️ Cloudflare Pages (optional)

Only needed for deploying previews to live public URLs. Without it, previews are still generated and viewable locally.

1. Sign up at [Cloudflare](https://dash.cloudflare.com/sign-up) (free tier works)
2. Note your **Account ID** from the dashboard sidebar
3. Go to **My Profile → API Tokens → Create Token**
4. Use the **Edit Cloudflare Pages** template, or create a custom token:
   - **Permissions:** Account → Cloudflare Pages → Edit
   - **Account Resources:** Include your account
5. Copy token and account ID into `.env`

### 🔐 Paver API Key

Internal shared secret between backend and dashboard containers:

```bash
cd backend && npm run generate-key
```

Or use any random string — just needs to match in both services.

---

## 📡 API Reference

All `/api/*` endpoints require `X-API-Key` header. `/health` and `/previews/*` are unauthenticated.

<details>
<summary><strong>Scan Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scan` | Scan an area for businesses |
| `GET` | `/api/scans` | List past scans (50 most recent) |

**POST /api/scan**
```json
{
  "area": "Bartow County, GA",
  "radius": 5000
}
```
Accepts `area` (geocoded), `lat`/`lng` directly, or `county`. Radius in meters (1,000–50,000, default 5,000).

</details>

<details>
<summary><strong>Business Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/businesses` | List with filters |
| `GET` | `/api/businesses/:id` | Detail with outreach history |
| `PATCH` | `/api/businesses/:id` | Update status, notes, or email |
| `POST` | `/api/businesses/:id/generate-preview` | Generate preview |
| `DELETE` | `/api/businesses/:id/preview` | Delete preview |
| `POST` | `/api/businesses/:id/approve` | Move to approved |
| `POST` | `/api/businesses/batch-generate-preview` | Batch generate (max 50) |

**GET /api/businesses** query params: `status`, `hasWebsite`, `county`, `websiteQuality`, `limit`, `offset`, `search`, `sort`

</details>

<details>
<summary><strong>Stats, Admin & Deploy</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats` | Dashboard analytics |
| `POST` | `/api/stats/reset` | ⚠️ Delete all data and previews |
| `POST` | `/api/deploy` | Deploy to Cloudflare Pages (max 50) |

**POST /api/deploy**
```json
{
  "businessIds": ["clxyz123...", "clxyz456..."]
}
```

</details>

---

## 🔒 Security

Paver is a **local/self-hosted tool**, not a multi-user SaaS. Keep these things in mind:

<details>
<summary><strong>🔑 API Authentication</strong></summary>

- All API endpoints use a single shared `X-API-Key` — not per-user auth
- Key comparison is simple string equality, not constant-time (fine for single-user, not for public APIs)
- No built-in rate limiting — add a reverse proxy if exposing publicly

</details>

<details>
<summary><strong>🌐 Network Exposure</strong></summary>

- Docker maps ports to **all interfaces** (0.0.0.0) by default. Bind to localhost if needed: `"127.0.0.1:4502:3001"`
- `/health` and `/previews/*` require no auth — anyone who can reach the backend can view previews
- For public access, put behind a reverse proxy (nginx, Caddy, Traefik) with authentication

</details>

<details>
<summary><strong>💾 Data Storage</strong></summary>

- SQLite file with no encryption at rest
- Contains publicly available business data (names, addresses, phones, emails, ratings) aggregated in one place
- Preview HTML files have no access control
- `POST /api/stats/reset` **deletes everything** with no undo

</details>

<details>
<summary><strong>🔐 API Keys & Secrets</strong></summary>

- `.env` is gitignored — keep it out of version control
- **Google API key:** restrict to "Places API (New)" only, consider IP restrictions. Leaked keys can run up charges
- **Cloudflare token:** scope to Pages edit permissions on your account only

</details>

<details>
<summary><strong>📡 Outbound Requests</strong></summary>

- **Scanning:** Google Places API + direct fetches to business websites (quality check, 10s timeout)
- **Deploying:** Cloudflare Pages API
- No data sent to any other third-party service

</details>

<details>
<summary><strong>📧 Email Compliance</strong></summary>

- Email templates are **not auto-sent** — Paver has no email sending capability
- If you add email sending: you're responsible for CAN-SPAM / GDPR compliance (physical address, unsubscribe, opt-out honoring)

</details>

---

## 🛠️ Development

Run without Docker:

```bash
# Backend
cd backend
npm install
cp ../.env .env
npm run db:push          # initialize database
npm run dev              # http://localhost:4500

# Dashboard (separate terminal)
cd dashboard
npm install
npm run dev              # http://localhost:3001
```

### Commands

```bash
# Backend
npm run db:generate      # regenerate Prisma client
npm run db:push          # push schema to SQLite
npm run db:studio        # visual DB browser
npm run generate-key     # new API key
npm run build            # compile TypeScript

# Dashboard
npm run dev:client       # Vite dev server (hot reload)
npm run dev:server       # Express proxy only
npm run dev              # both
npm run build            # production build
```

---

## 🏗️ Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────┐
│    Dashboard     │──────▶│   Backend API    │──────▶│  SQLite  │
│  React + Express │  API  │  Express / TS    │ Prisma│          │
│     :3001        │◀──────│     :4500        │◀──────│ paver.db │
└─────────────────┘       └──────┬───────────┘       └──────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              Google Places   Business    Cloudflare
                 API          Websites     Pages API
              (discover)     (assess)     (deploy)
```

| Component | Stack |
|-----------|-------|
| **Backend** | TypeScript, Express 4, Prisma 5, Zod, SQLite |
| **Dashboard** | React 18, Vite 5, Tailwind CSS 3, Express proxy |
| **Database** | SQLite at `data/paver.db` (auto-created) |
| **Previews** | Static HTML in `data/previews/`, served at `/previews/*` |

The dashboard proxies `/api/*` and `/previews/*` to the backend, and also makes direct SQLite reads (better-sqlite3) for some UI queries.

---

## 🤖 Claude Code Integration

Paver ships with a Claude Code skill at `.claude/commands/paver.md`. If you use [Claude Code](https://claude.ai/claude-code), you can run:

```
/paver
```

This gives Claude full context on how to install, configure, scan, generate previews, deploy, and troubleshoot Paver — including all API endpoints with curl examples. Useful for getting help without leaving your terminal.

---

## 📄 License

[MIT](LICENSE) — do whatever you want with it.
