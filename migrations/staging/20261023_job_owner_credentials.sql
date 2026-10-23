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
