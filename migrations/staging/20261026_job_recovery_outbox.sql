-- STAGING ONLY. Never install on production or enable public recovery.
-- Revised v2 draft: possession-based redemption. NOT an in-place upgrade.
-- May be installed only by the fingerprint-checked synthetic mail lab or the
-- explicit Admin11767 closed-fixture QA installer after all its prerequisites.
-- The public recovery routes and operational restore remain disabled.
CREATE TABLE IF NOT EXISTS job_recovery_outbox (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  job_id TEXT NOT NULL REFERENCES job_owner_credentials(job_id),
  record_revision INTEGER NOT NULL CHECK(record_revision > 0),
  credential_revision INTEGER NOT NULL CHECK(credential_revision > 0),
  recipient_hash TEXT NOT NULL CHECK(length(recipient_hash) = 64),
  token_hash TEXT NOT NULL UNIQUE CHECK(length(token_hash) = 64),
  sealed_payload TEXT,
  state TEXT NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sending','accepted','redeemed','expired','cancelled','failed')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK(expires_at > created_at),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
  next_at INTEGER NOT NULL,
  lease_until INTEGER NOT NULL DEFAULT 0,
  lease_owner TEXT,
  provider_id TEXT,
  accepted_at INTEGER,
  redeemed_at INTEGER,
  redeemed_secret_hash TEXT,
  last_error TEXT,
  CHECK((state IN ('queued','sending') AND sealed_payload IS NOT NULL) OR
        (state IN ('accepted','redeemed','expired','cancelled','failed') AND sealed_payload IS NULL)),
  CHECK(state <> 'accepted' OR (provider_id IS NOT NULL AND accepted_at IS NOT NULL)),
  CHECK(state <> 'redeemed' OR (redeemed_at IS NOT NULL AND length(redeemed_secret_hash)=64))
);
CREATE UNIQUE INDEX IF NOT EXISTS job_recovery_one_active_revision ON job_recovery_outbox(job_id,credential_revision) WHERE state IN ('queued','sending','accepted');
CREATE INDEX IF NOT EXISTS job_recovery_ready ON job_recovery_outbox(state,next_at,lease_until,expires_at);
