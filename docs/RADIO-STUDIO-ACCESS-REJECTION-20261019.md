# Radio Studio — access rejection cleanup — 2026-10-19

Audit branch only. No production, Worker, credentials or permission changes.

## Reproduced defect
An authorized operator's existing chat and unsent draft remained in the page after a later chat refresh returned 403 or a chat send returned 401. The backend rejected access, but the frontend retained the previously loaded private view.

## Correction
For a response belonging to the currently selected credential, HTTP 401/403 now invalidates pending UI work, clears requests/chat/draft/reply context, hides Studio and unlocks refresh. It presents specific guidance for revoked permission or invalid session. Reuses the account-change cleanup and does not delete or create account credentials. Old credential responses do not clear a newly selected account. HTTP rejection handling precedes JSON parsing, so invalid error bodies cannot prevent cleanup.

Cleanup is triggered when an operation receives an access rejection; it is not instant server-driven revocation while the page is idle. No polling or push introduced.

## Validation
Two new regression tests failed before the fix and pass after it. Complete radio-studio-ui suite: 11/11 passed, covering absent account, station permissions, duplicate refresh, account change during requests, foreign station responses, moderation acknowledgement, unconfirmed send draft retention and late response suppression. Tests use isolated synthetic credentials and responses; no real grants or messages.

Commits: frontend 10fee3b3148c8bcdd6938de04054703c0a282aff; regression tests a2bfd5500587d881c08f4ffc31512849cc7f36a1.

Pending: published Pages delivery/visual verification, authorized operator browser end-to-end and physical mobile/tablet/TV. Existing YouTube zero-time playback gate remains unresolved.
