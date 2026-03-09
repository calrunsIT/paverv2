# Paver v2

Automated local business discovery and website preview generation platform for web design agencies doing cold outreach.

## What It Does

Scans geographic areas via Google Places API, finds businesses without professional websites, generates preview websites, and deploys them to Cloudflare Pages as sales demos.

## Architecture

```
Dashboard (React + Express proxy, port 3001) → Backend API (Express/TS, port 4500) → SQLite (/data/paver.db)
                                                        ↓                    ↓
                                              Google Places API    Cloudflare Pages API
```

- **Backend** (`/backend`): TypeScript/Express API with Prisma ORM on SQLite
- **Dashboard** (`/dashboard`): React 18 + Vite + Tailwind (dark theme), served by Express proxy
- **Database**: SQLite at `/data/paver.db`, schema in `/backend/prisma/schema.prisma`
- **Previews**: Generated HTML files stored in `/data/previews/`, served at `/previews/*`

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | TypeScript, Express 4, Prisma 5, Zod |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6 |
| Database | SQLite (Prisma ORM backend, better-sqlite3 dashboard direct reads) |
| Deployment | Docker (Alpine Node 20) |

## Key Files

- `backend/src/server.ts` - Express server entry
- `backend/src/routes/{scan,business,stats,deploy}.ts` - API endpoints
- `backend/src/services/googlePlaces.ts` - Business discovery
- `backend/src/services/previewGenerator.ts` - HTML preview generation (15 templates: restaurant/contractor/beauty/healthcare/automotive/retail/professional/fitness/church/pets/lodging/education/events/cleaning/generic)
- `backend/src/services/websiteQuality.ts` - Website analysis + email/social extraction
- `backend/src/services/cloudflarePages.ts` - CF Pages deployment
- `backend/prisma/schema.prisma` - Database schema (Business, Scan, OutreachEmail, OutreachNote)
- `dashboard/client/src/pages/Dashboard.jsx` - Main business list view
- `dashboard/client/src/pages/BusinessDetail.jsx` - Single business detail + outreach
- `dashboard/client/src/pages/ScanManagement.jsx` - Trigger scans, view history
- `dashboard/server/index.js` - Express proxy + SPA server

## API

All `/api/*` endpoints require `X-API-Key` header. Key format: `pvr_[32hex]`.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/scan | Scan area for businesses |
| GET | /api/scans | List past scans |
| GET | /api/businesses | List businesses (filterable) |
| GET | /api/businesses/:id | Business detail |
| PATCH | /api/businesses/:id | Update status/notes/email |
| POST | /api/businesses/:id/generate-preview | Generate preview site |
| DELETE | /api/businesses/:id/preview | Delete preview |
| POST | /api/businesses/:id/approve | Mark approved |
| POST | /api/businesses/batch-generate-preview | Batch generate (max 50) |
| GET | /api/stats | Dashboard analytics |
| POST | /api/stats/reset | **DESTRUCTIVE** - wipe all data |
| POST | /api/deploy | Deploy to Cloudflare Pages (max 50) |

## Business Status Pipeline

`discovered` → `preview_generated` → `approved` → `emailed` → `responded` → `converted` | `skipped`

## Development

```bash
# Backend
cd backend && npm run dev          # Dev server with hot reload
npm run db:generate                # Generate Prisma client
npm run db:push                    # Push schema to SQLite
npm run db:studio                  # Prisma Studio UI

# Dashboard
cd dashboard && npm run dev        # Client + server concurrently

# Docker
docker compose up --build          # Full stack
```

## Environment Variables

```
PAVER_API_KEY=pvr_...              # API auth key
GOOGLE_PLACES_API_KEY=             # Google Places API
CF_API_TOKEN=                      # Cloudflare API token
CF_ACCOUNT_ID=                     # Cloudflare account ID
CF_PROJECT_NAME=paver              # CF Pages project name
```

## Conventions

- ES modules throughout (type: module)
- Zod for request validation in backend
- Dashboard proxy forwards `/api/*` and `/previews/*` to backend
- Dashboard also does direct SQLite reads for some UI queries (better-sqlite3)
- Dark theme UI with Tailwind
- Docker multi-stage builds (builder + runtime)
- Branding (company name, phone, email, pricing) configurable via env vars
