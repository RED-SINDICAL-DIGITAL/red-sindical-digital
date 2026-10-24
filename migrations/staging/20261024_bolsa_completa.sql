-- UADAV STREAM V11.7 / 11758 - SOLO D1 STAGING
-- Crear tablas faltantes. No migra datos, no borra registros y no activa flags.
-- Antes de ejecutar: verificar el binding DB de uadav-api-staging y conservar un backup.

-- Fuente: 20261023_job_owner_credentials.sql
-- UADAV STREAM · STAGING ONLY · migration draft 2026-10-23
-- Requires manual review. Do not apply to production.
-- The legacy jobs.data_json in D1 mirrors KV; do NOT treat it as atomic credential authority.
-- A new authoritative per-job credential row avoids rewriting the entire KV collection.
CREATE TABLE IF NOT EXISTS job_owner_credentials (
  job_id TEXT PRIMARY KEY,
  secret_hash TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS job_owner_recovery_tokens (
  token_hash TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY(job_id) REFERENCES job_owner_credentials(job_id)
);
CREATE INDEX IF NOT EXISTS idx_job_owner_recovery_expiry ON job_owner_recovery_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_job_owner_recovery_job ON job_owner_recovery_tokens(job_id);

-- Required app algorithm (DO NOT use standalone autocommit statements):
-- 1. Validate token hash + expiry + job identity from D1, with a single-use condition.
-- 2. Generate new credential before transaction.
-- 3. In one D1 batch transaction, mark token consumed ONLY IF consumed_at IS NULL
--    AND expires_at > current time, and rotate job_owner_credentials revision/hash.
-- 4. Confirm affected rows and transaction success BEFORE returning the new secret.
-- 5. Access checks must read job_owner_credentials, NOT stale KV owner_access_hash.
-- 6. Existing secret hashes need careful one-time backfill from KV with validation;
--    changing authority before backfill would lock owners out.
-- 7. Do not expose secret hashes to public or admin list APIs.
-- 8. Token delivery must NOT be retried with secret values in logs/notification bodies.
-- 9. Keep the recovery endpoints disabled until migration and concurrency tests pass.

-- Fuente: 20261024_job_store.sql
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

-- Diagnostico final: deben aparecer estas siete tablas. No devuelve datos personales.
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('job_owner_credentials','job_owner_recovery_tokens','job_store_meta','job_store_records','job_store_checks','job_store_rates','job_owner_recovery_v2') ORDER BY name;
