# Unaccepted tool edits — 2026-10-15

Changes on audit/public-job-status-20261012 only; production unchanged.

Opening a tool editor resets its input-change marker. Typing marks the open dialog as having unaccepted changes. The beforeunload handler now requests the browser's standard warning when either workspace changes await persistence or an open editor contains unaccepted changes. Cancelling/closing the dialog keeps the existing discard behavior and does not leave a false warning marker active.

Validation: node --test tests/workspace-daily-tools.test.cjs tests/artist-workspace-session.test.cjs — 15 passed, 0 failed. Covers pristine, edited, closed and pending-save states. Browser warnings depend on browser interaction rules; actual authenticated browser confirmation remains pending because the cloud browser no longer has the synthetic artist session. No automatic saving of unaccepted dialog input was added.
