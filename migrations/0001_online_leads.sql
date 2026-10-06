CREATE TABLE IF NOT EXISTS online_leads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  project_type TEXT,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lead_photos (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT,
  content_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_id) REFERENCES online_leads(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_online_leads_created_at ON online_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_photos_lead_id ON lead_photos(lead_id);
