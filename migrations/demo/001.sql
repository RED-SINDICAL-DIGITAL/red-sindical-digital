CREATE TABLE IF NOT EXISTS demo_requests (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created INTEGER NOT NULL,
  expires INTEGER,
  sent INTEGER,
  redeemed INTEGER,
  session_hash TEXT UNIQUE,
  session_until INTEGER
);
CREATE TABLE IF NOT EXISTS demo_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  paused INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO demo_state(id,paused) VALUES(1,0);
