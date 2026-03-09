import express from 'express';
import cors from 'cors';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Backend Proxy Config ---
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4500';
const BACKEND_API_KEY = process.env.PAVER_API_KEY || '';

async function proxyToBackend(req, res, method, path, body) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BACKEND_API_KEY
      },
    };
    if (body) options.body = JSON.stringify(body);
    const response = await fetch(`${BACKEND_URL}${path}`, options);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`Proxy error (${method} ${path}):`, error.message);
    res.status(502).json({ error: 'Backend unreachable', message: error.message });
  }
}

// --- Proxy Routes (to backend API) ---
app.post('/api/scan', (req, res) => proxyToBackend(req, res, 'POST', '/api/scan', req.body));
app.get('/api/scans', (req, res) => proxyToBackend(req, res, 'GET', '/api/scans'));
app.post('/api/businesses/batch-generate-preview', (req, res) => proxyToBackend(req, res, 'POST', '/api/businesses/batch-generate-preview', req.body));
app.post('/api/businesses/:id/generate-preview', (req, res) => proxyToBackend(req, res, 'POST', `/api/businesses/${req.params.id}/generate-preview`));
app.post('/api/deploy', (req, res) => proxyToBackend(req, res, 'POST', '/api/deploy', req.body));
app.delete('/api/businesses/:id/preview', (req, res) => proxyToBackend(req, res, 'DELETE', `/api/businesses/${req.params.id}/preview`));
app.post('/api/stats/reset', (req, res) => proxyToBackend(req, res, 'POST', '/api/stats/reset'));

// --- Direct DB Routes ---

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM businesses').get().count;
  const noWebsite = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE websiteQuality = 'none' OR websiteQuality IS NULL").get().count;
  const facebookOnly = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE websiteQuality = 'facebook_only'").get().count;
  const poor = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE websiteQuality = 'poor'").get().count;
  const decent = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE websiteQuality = 'decent'").get().count;
  const contacted = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE status = 'contacted'").get().count;
  const converted = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE status = 'converted'").get().count;
  const previews = db.prepare("SELECT COUNT(*) as count FROM businesses WHERE status = 'preview_generated' OR previewUrl IS NOT NULL").get().count;

  res.json({
    total,
    noWebsite,
    facebookOnly,
    poor,
    decent,
    contacted,
    converted,
    previews,
  });
});

// GET /api/businesses
app.get('/api/businesses', (req, res) => {
  const { status, quality, search, sort } = req.query;
  let where = [];
  let params = {};

  if (status) {
    where.push('b.status = @status');
    params.status = status;
  }
  if (quality) {
    if (quality === 'none') {
      where.push("(b.websiteQuality = 'none' OR b.websiteQuality IS NULL)");
    } else {
      where.push('b.websiteQuality = @quality');
      params.quality = quality;
    }
  }
  if (search) {
    where.push("(b.name LIKE @search OR b.city LIKE @search OR b.phone LIKE @search)");
    params.search = `%${search}%`;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  let orderBy = 'ORDER BY b.discoveredAt DESC';
  if (sort === 'priority') {
    orderBy = `ORDER BY
      CASE b.websiteQuality
        WHEN 'none' THEN 0
        WHEN 'facebook_only' THEN 1
        WHEN 'poor' THEN 2
        WHEN 'decent' THEN 3
        ELSE 0
      END ASC,
      b.discoveredAt DESC`;
  } else if (sort === 'name') {
    orderBy = 'ORDER BY b.name ASC';
  } else if (sort === 'status') {
    orderBy = 'ORDER BY b.status ASC, b.discoveredAt DESC';
  }

  const sql = `SELECT b.* FROM businesses b ${whereClause} ${orderBy}`;
  const businesses = db.prepare(sql).all(params);
  res.json(businesses);
});

// GET /api/businesses/:id
app.get('/api/businesses/:id', (req, res) => {
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const notes = db.prepare('SELECT * FROM outreach_notes WHERE businessId = ? ORDER BY createdAt DESC').all(req.params.id);
  const emails = db.prepare('SELECT * FROM outreach_emails WHERE businessId = ? ORDER BY sentAt DESC').all(req.params.id);

  res.json({ ...business, notes, emails });
});

// PATCH /api/businesses/:id
app.patch('/api/businesses/:id', (req, res) => {
  const { status, notes } = req.body;
  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  if (status) {
    db.prepare('UPDATE businesses SET status = ? WHERE id = ?').run(status, req.params.id);
  }
  if (notes !== undefined) {
    db.prepare('UPDATE businesses SET notes = ? WHERE id = ?').run(notes, req.params.id);
  }
  if (req.body.previewUrl !== undefined) {
    db.prepare('UPDATE businesses SET previewUrl = ? WHERE id = ?').run(req.body.previewUrl, req.params.id);
  }

  const updated = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// POST /api/businesses/:id/notes
app.post('/api/businesses/:id/notes', (req, res) => {
  const { type, note, outcome } = req.body;
  if (!type || !note) return res.status(400).json({ error: 'type and note are required' });

  const business = db.prepare('SELECT * FROM businesses WHERE id = ?').get(req.params.id);
  if (!business) return res.status(404).json({ error: 'Business not found' });

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  db.prepare('INSERT INTO outreach_notes (id, businessId, type, note, outcome, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, type, note, outcome || null, createdAt);

  const created = db.prepare('SELECT * FROM outreach_notes WHERE id = ?').get(id);
  res.status(201).json(created);
});

// DELETE /api/notes/:id
app.delete('/api/notes/:id', (req, res) => {
  const result = db.prepare('DELETE FROM outreach_notes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Note not found' });
  res.json({ ok: true });
});

// --- Proxy preview pages from backend ---
app.get('/previews/*', async (req, res) => {
  try {
    const response = await fetch(`${BACKEND_URL}${req.path}`);
    if (!response.ok) return res.status(response.status).send('Preview not found');
    const html = await response.text();
    res.type('html').send(html);
  } catch (error) {
    res.status(502).send('Backend unreachable');
  }
});

// --- Serve static frontend in production ---
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Paver Dashboard API running on port ${PORT}`);
});
