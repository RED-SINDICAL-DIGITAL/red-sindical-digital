# Account recovery and deletion regression — 2026-10-16

Actual audit-branch Worker blob03a02b7c9e92a63b428ac61e12ddb50242f9588e matches local git hash-object. New isolated Worker + transactional SQLite test passed:

- Rotating recovery invalidates the original and previous recovery credentials, while both approved devices keep access.
- Deletion rejects stale revision and missing explicit ELIMINAR confirmation.
- SQLite trigger injected during account deletion produces503; transaction rolls back deletion marker and keeps both devices usable.
- Successful deletion invalidates all old device and recovery credentials and cannot be undone by POST with an old credential.
- A fresh account from the same synthetic IP192.0.2.42 is allowed and does not inherit the deleted library.
- An account with an active verified artist is protected by409 ARTISTS_REQUIRE_ACTION; both account and artist session remain usable.

Initial test expected an exception, then500; inspection of actual returned status confirmed the Worker wraps this database failure as503. The test now asserts that response and independently asserts rollback/state, rather than treating an unhandled throw as required behavior. No application change was necessary.

Added tests/account-recovery-deletion.mjs to CI. This run uses only in-memory isolated synthetic data, no remote deletion or credential rotation, no production change or deploy. It does not certify browser confirmation dialogs, cloud D1 fault injection, physical devices or payment renewal after recreation. Complete user-facing recovery/deletion journey and print/export remain release gates.
