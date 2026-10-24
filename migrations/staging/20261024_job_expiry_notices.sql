CREATE TABLE IF NOT EXISTS job_expiry_notices (
 notice_id TEXT PRIMARY KEY,
 job_id TEXT NOT NULL,
 deadline TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('soon','expired')),
 account_id TEXT NOT NULL,
 run_id TEXT NOT NULL,
 created_at TEXT NOT NULL,
 UNIQUE(job_id,deadline,kind,account_id),
 FOREIGN KEY(account_id) REFERENCES audience_accounts(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_job_expiry_notices_job ON job_expiry_notices(job_id);
SELECT name FROM sqlite_master WHERE type='table' AND name='job_expiry_notices';
