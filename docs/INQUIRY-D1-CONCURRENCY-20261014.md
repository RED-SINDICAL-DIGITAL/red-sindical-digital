# Inquiry storage concurrency — 2026-10-14

Reproduced: two concurrent public submissions both returned 200 but only one survived in the recipient inbox because both replaced the same KV array. New inquiries now INSERT individual records into the existing contracts D1 table, tagged record_type=artist_inquiry. No new infrastructure/table or destructive migration. D1 is required for new submissions; an INSERT failure returns 503 INQUIRY_SAVE_FAILED without a false success.

Shared reader merges legacy KV inquiries and tagged D1 records by id, with D1 authoritative for collisions. Existing contracts without this inquiry marker are not included by the D1 read. Artist inbox, Admin and account notifications use this merged source; existing per-inquiry state overlay remains. Old KV data is not rewritten. D1 reads use a primary session where available.

PASS actual Worker + SQLite: deterministic simultaneous KV-read barrier now retains both successful submissions and both account notifications; legacy records remain readable/editable via state overlay without KV mutation; stale duplicate KV copy cannot override D1 identity/content; injected insertion error returns 503 and creates no new inbox item. Existing recipient privacy/lifecycle and 42 node:test cases pass; syntax passes.

Limits: existing overall 2000-inquiry capacity guard still reads before insertion and is not a strict concurrent quota. No submission idempotency key yet, so a deliberate retry after a lost success response can create a second distinct inquiry. Other legacy KV writers/import paths need review. This change is not deployed to Cloudflare staging/production and does not claim remote load or UI verification.
