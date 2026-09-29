PRAGMA foreign_keys=ON;

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
