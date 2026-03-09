import Database from 'better-sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'paver.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migration: ensure outreach_notes table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS outreach_notes (
    id TEXT PRIMARY KEY,
    businessId TEXT NOT NULL,
    type TEXT NOT NULL,
    note TEXT NOT NULL,
    outcome TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (businessId) REFERENCES businesses(id)
  )
`);

export default db;
