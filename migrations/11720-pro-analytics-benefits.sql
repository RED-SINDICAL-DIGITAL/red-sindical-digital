-- ★ UADAV STREAM · V11.7 / build 11719+
-- PREPARACIÓN D1. NO se ejecuta automáticamente desde GitHub.
-- El Worker productivo continúa desplegándose desde Cloudflare.

CREATE TABLE IF NOT EXISTS artist_plan_state (
  artist_id TEXT PRIMARY KEY,
  plan TEXT NOT NULL DEFAULT 'free' CHECK(plan IN ('free','pro')),
  pro_started_at TEXT,
  pro_expires_at TEXT,
  source TEXT DEFAULT 'admin',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artist_support_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  label TEXT,
  url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_support_artist ON artist_support_links(artist_id,active);

CREATE TABLE IF NOT EXISTS audience_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id TEXT,
  content_id TEXT,
  event_type TEXT NOT NULL,
  session_id TEXT,
  source_page TEXT,
  province TEXT,
  country TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audience_artist_event ON audience_events(artist_id,event_type,created_at);
CREATE INDEX IF NOT EXISTS idx_audience_created ON audience_events(created_at);

CREATE TABLE IF NOT EXISTS artist_ai_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id TEXT NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('7d','30d','90d','custom')),
  period_start TEXT,
  period_end TEXT,
  metrics_json TEXT NOT NULL,
  summary TEXT,
  recommendations_json TEXT,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_reports_artist ON artist_ai_reports(artist_id,created_at);

CREATE TABLE IF NOT EXISTS travel_benefits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Argentina',
  address TEXT,
  benefit_text TEXT,
  audience TEXT NOT NULL DEFAULT 'artist' CHECK(audience IN ('public','artist','artist_pro','uadav_member')),
  contact_url TEXT,
  image_url TEXT,
  starts_at TEXT,
  expires_at TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_benefits_location ON travel_benefits(province,city,active);
CREATE INDEX IF NOT EXISTS idx_benefits_audience ON travel_benefits(audience,active);

CREATE TABLE IF NOT EXISTS marketplace_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  artist_id TEXT,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price_text TEXT,
  city TEXT,
  province TEXT,
  image_url TEXT,
  contact_url TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category,active);

-- Eventos internos permitidos para Analytics PRO:
-- profile_view, play_start, follow, favorite, playlist_add,
-- ticket_click, hire_click, support_click, share.
-- Nunca etiquetar play_start como reproducción oficial de YouTube/Spotify ni como regalía.
