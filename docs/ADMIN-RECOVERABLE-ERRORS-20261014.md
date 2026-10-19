# Recoverable artist approval and Admin API replay — 2026-10-14

After confirmed D1 ownership approval, downstream catalog/invitation/account/notification/audit failures now return 503 with code ARTIST_APPROVAL_SYNC_PENDING, approval_saved=true, retryable=true, claim_id and artist_id. No token or internal exception is exposed. Without D1 the response does not claim ownership was committed. Initial approval transaction failures remain outside this downstream handler.

Admin preserves HTTP status/code/data on API errors and stops fallback on explicit server errors or mutation transport failures, avoiding automatic replay against another configured API. Existing local 404 fallback behavior is retained. Reads can still fall back after a transport failure. The claim review handler catches recoverable approval errors, invalidates artist/claim/owner caches, refreshes the view and displays the recovery instruction.

PASS: actual Worker + SQLite interrupted catalog recovery and lifecycle; four isolated tests using the actual Admin API function cover mutation network failure, structured 503 metadata, GET network fallback and denied GET without fallback. Admin inline script parses. CI updated, current run not checked. No browser visual validation or staging/production deployment performed.

Limits: approved catalog metadata alone is not a complete signal of downstream account/notification failure. The current recovery button detects catalog mismatch; finer recovery-state persistence remains a possible follow-up. Transport failures after a successful mutation still require checking state before an intentional retry.
