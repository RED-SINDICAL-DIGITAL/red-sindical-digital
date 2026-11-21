# Radio Studio — request update recovery — 2026-10-19

Audit branch only. No Worker, permission or production changes.

Added four behavior tests for the existing operator inbox:
- Confirmed D1 state is reflected while a failed KV mirror is explicitly reported as pending synchronization.
- A success envelope for a different station cannot change the visible request.
- A lost PATCH response preserves the last confirmed state, tells the operator to refresh, and does not permit overlapping writes.
- A late PATCH acknowledgement cannot restore private data after switching account.

All 27 tests passed across radio-studio-ui, radio-studio-entry and radio-operators-admin. These cases required no new runtime correction. Test commit e6366dfbb82ebdde93914e77957d5d99a391afe4.

A direct scratch-runtime GET of the staging manifest returned HTTP 403, so that path did not establish the deployed source hash. This is not evidence of bot detection or a site outage. GitHub deployment checks are separate evidence of pipeline status, not authenticated browser verification.

Remaining release gates are unchanged: authorized operator browser flow, actual YouTube elapsed playback, and physical target devices. Local mocked responses do not certify those gates.
