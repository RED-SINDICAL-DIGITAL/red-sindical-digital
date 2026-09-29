PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  province TEXT,
  type TEXT NOT NULL DEFAULT 'seccional',
  active INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT,
  stage_name TEXT,
  category TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  affiliation_status TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  status TEXT,
  visible INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_artists_province ON artists(province);
CREATE INDEX IF NOT EXISTS idx_artists_category ON artists(category);
CREATE INDEX IF NOT EXISTS idx_artists_status ON artists(status);
CREATE INDEX IF NOT EXISTS idx_artists_source ON artists(source_id);

CREATE TABLE IF NOT EXISTS producers (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  city TEXT,
  province TEXT,
  country TEXT,
  status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_producers_province ON producers(province);
CREATE INDEX IF NOT EXISTS idx_producers_source ON producers(source_id);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  title TEXT NOT NULL,
  category TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  venue TEXT,
  start_date TEXT,
  end_date TEXT,
  status TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  payment_status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);

CREATE TABLE IF NOT EXISTS radios (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  city TEXT,
  province TEXT,
  country TEXT,
  status TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  pauta_status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_radios_featured ON radios(featured);
CREATE INDEX IF NOT EXISTS idx_radios_pauta ON radios(pauta_status);
CREATE INDEX IF NOT EXISTS idx_radios_province ON radios(province);

CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  title TEXT NOT NULL,
  category TEXT,
  city TEXT,
  province TEXT,
  status TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(active);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_province ON jobs(province);

CREATE TABLE IF NOT EXISTS job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  artist_id TEXT,
  status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_job_apps_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_apps_artist ON job_applications(artist_id);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  artist_id TEXT,
  producer_id TEXT,
  status TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contracts_artist ON contracts(artist_id);
CREATE INDEX IF NOT EXISTS idx_contracts_producer ON contracts(producer_id);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  status TEXT,
  payment_status TEXT,
  starts_at TEXT,
  ends_at TEXT,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_campaign_entity ON campaigns(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_campaign_status ON campaigns(status);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL,
  template TEXT NOT NULL,
  recipient TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  sent_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_type TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  meta_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL
);

-- Full-text search base for artists, events, radios and producers.
CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  title,
  subtitle,
  body,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TABLE IF NOT EXISTS artist_claims (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL,
  name TEXT,
  email TEXT NOT NULL,
  whatsapp TEXT,
  proof_url TEXT,
  social_url TEXT,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_artist_claims_artist ON artist_claims(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_claims_status ON artist_claims(status);
CREATE INDEX IF NOT EXISTS idx_artist_claims_email ON artist_claims(email);

CREATE TABLE IF NOT EXISTS venues (
  id TEXT PRIMARY KEY,
  source_id TEXT,
  name TEXT NOT NULL,
  city TEXT,
  province TEXT,
  country TEXT,
  address TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'candidate',
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES sources(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_venues_province ON venues(province);
CREATE INDEX IF NOT EXISTS idx_venues_status ON venues(status);

CREATE TABLE IF NOT EXISTS event_occurrences (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT,
  timezone TEXT DEFAULT 'America/Argentina/Buenos_Aires',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_event ON event_occurrences(event_id);
CREATE INDEX IF NOT EXISTS idx_event_occurrences_start ON event_occurrences(start_at);

CREATE TABLE IF NOT EXISTS search_restrictions (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  value TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_search_restrictions_kind ON search_restrictions(kind);
CREATE INDEX IF NOT EXISTS idx_search_restrictions_active ON search_restrictions(active);

CREATE TABLE IF NOT EXISTS prospecting_runs (
  id TEXT PRIMARY KEY,
  country TEXT,
  region TEXT,
  category TEXT,
  query TEXT,
  resource_type TEXT,
  provider TEXT,
  status TEXT,
  result_count INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prospecting_runs_created ON prospecting_runs(created_at);

CREATE TABLE IF NOT EXISTS prospecting_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  resource_type TEXT,
  external_id TEXT,
  title TEXT,
  channel_name TEXT,
  category TEXT,
  city TEXT,
  province TEXT,
  country TEXT,
  thumbnail TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'candidate',
  raw_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_run ON prospecting_results(run_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_external ON prospecting_results(external_id);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_status ON prospecting_results(status);
CREATE INDEX IF NOT EXISTS idx_prospecting_results_category ON prospecting_results(category);
