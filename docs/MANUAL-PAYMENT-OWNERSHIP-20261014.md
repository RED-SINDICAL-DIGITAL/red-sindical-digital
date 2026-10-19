# Manual payment ownership guard — 2026-10-14

Reproduced a defect: administrator approval returned 200 for an account-bound reported order whose artist link no longer matched the active owner. The shared fulfillment INSERT now checks current account existence, absence of account deletion, unexpired link, and matching active ownership inside the D1 transaction. Thus manual and bank activation share the atomic guard. Legacy orders with account_id NULL retain their existing manual-review compatibility; they require administrative attention rather than automatic bank processing.

Regression test failed before the fix (200 versus expected 409), then passed. Also verified that restoring a valid link permits approval, and that a rejection inserted immediately before the fulfillment batch leaves the order rejected with no fulfillment. Existing signed bank/recovery, FREE/PRO and 29 node:test cases pass locally; Worker syntax passes. These tests use actual Worker and isolated SQLite, not remote payment activation. Already-approved idempotent retry behavior remains unchanged.

Changes are on audit/public-job-status-20261012 only. Staging Worker and production have not received this update. Further checks: actual Cloudflare payment/ownership races, public/admin visual flows and integration of the separate artist-session branch.
