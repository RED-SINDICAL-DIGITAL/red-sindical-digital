# Radio Studio — cross-tab storage clearing — 2026-10-19

Audit branch only. Production and Worker unchanged.

## Confirmed before this pass
Commit 2b30eb4ddfae851ed2fee29f439cd0af4767e523: Cloudflare Pages, static-contract and both contract checks completed successfully. This confirms pipeline completion, not authenticated operator browser acceptance.

## Defect reproduced and fixed
The Radio Studio page and profile Studio entry listened only for storage events naming uadav_account_access_v1. A localStorage.clear() in another same-origin tab emits key=null. Both views could retain the old private display/access entry after the credential was removed.

Both listeners now handle key=null through their existing cleanup/refresh path. Studio clears requests/chat/draft and hides its private view; profile hides the entry. No account creation, deletion or permission changes. The profile test confirms no private API call occurs once the credential is absent.

## Validation
Two regression tests failed before correction and passed after. All 23 UI tests pass across radio-studio-ui, radio-studio-entry and radio-operators-admin.

Ran the repository Worker against isolated SQLite and mock KV:
- radio-studio-integration.mjs passed: account and station isolation, verified synthetic Admin grant/revoke, request states, KV mirror failure recovery, moderated chat approval, rejected foreign replies and rejection of moderation publication after revocation.
- radio-interaction-integration.mjs passed: private Admin inbox, radio requests, station filtering, chat reply isolation and moderated request approval.

These are local integration tests with synthetic credentials. No real operators enabled, messages sent, requests submitted or production data touched. Cloudflare D1 integration and physical devices are not certified by the local SQLite adapter.

New source deployment and real operator session verification remain pending.
