-- STAGING ONLY. Install after 20261023_job_owner_credentials.sql.
-- No environment flag is enabled by this migration. KV remains untouched.
CREATE TABLE IF NOT EXISTS job_store_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS job_store_records (
  collection TEXT NOT NULL CHECK(collection IN ('bolsa_trabajo','postulaciones_trabajo')),
  id TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK(json_valid(data_json)),
  request_id TEXT,
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(collection,id)
);
CREATE UNIQUE INDEX IF NOT EXISTS job_store_unique_request
  ON job_store_records(collection,request_id) WHERE request_id IS NOT NULL;
-- A failed precondition must raise an SQL error INSIDE the batch. A zero-row
-- UPDATE alone does not roll back the other statements in a D1 batch.
CREATE TABLE IF NOT EXISTS job_store_checks (
  id TEXT PRIMARY KEY,
  valid INTEGER NOT NULL CHECK(valid = 1)
);
CREATE TABLE IF NOT EXISTS job_store_rates (
  bucket TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  resets_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS job_owner_recovery_v2 (
  token_hash TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES job_owner_credentials(job_id),
  credential_revision INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS job_recovery_v2_expiry ON job_owner_recovery_v2(expires_at);
