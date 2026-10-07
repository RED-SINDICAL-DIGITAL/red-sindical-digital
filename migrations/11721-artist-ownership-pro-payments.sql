-- V11.7.21 · Artist ownership + PRO direct-transfer operations
-- Idempotent migration. Transitional artist tokens remain in KV; ownership is modeled separately.

CREATE TABLE IF NOT EXISTS artist_owners (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL,
  claim_id TEXT,
  contact_email TEXT,
  role TEXT NOT NULL DEFAULT 'owner',
  status TEXT NOT NULL DEFAULT 'active',
  verification_level TEXT NOT NULL DEFAULT 'admin_approved',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_artist_owners_artist ON artist_owners(artist_id,status);
CREATE INDEX IF NOT EXISTS idx_artist_owners_claim ON artist_owners(claim_id);
CREATE INDEX IF NOT EXISTS idx_artist_owners_email ON artist_owners(contact_email);

CREATE TABLE IF NOT EXISTS artist_claim_evidence (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  value TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim ON artist_claim_evidence(claim_id,status);

CREATE TABLE IF NOT EXISTS pro_payment_orders (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL,
  account_id TEXT,
  plan_period TEXT NOT NULL DEFAULT 'annual',
  duration_days INTEGER NOT NULL DEFAULT 365,
  amount REAL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  payment_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payer_name TEXT,
  payer_note TEXT,
  receipt_url TEXT,
  reported_at TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pro_orders_status ON pro_payment_orders(status,created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pro_orders_artist ON pro_payment_orders(artist_id,created_at DESC);
