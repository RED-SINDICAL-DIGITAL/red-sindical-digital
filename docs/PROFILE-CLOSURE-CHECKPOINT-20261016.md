# Mi perfil / artist closure checkpoint — 2026-10-16

Branch audit/public-job-status-20261012. Production untouched.

## Actual remote Cloudflare PASS
Read-only staging smoke passed: D1/KV health, enrollment closed, private anonymous routes401.

Expanded staging-device-integration.mjs passed against the existing deployed staging Worker using current branch account client:
- Create synthetic account, approve second independent device credential, connect and sync profile/favorites/following in both directions.
- Device grants remain non-expiring unless revoked.
- Create one synthetic private FREE artist; both approved devices resolve exactly the same artist through account/artists and obtain workspace access without manual management link.
- Anonymous public artist lookup404.
- Revoke second device: its existing artist workspace session401; desktop existing artist workspace session remains200.
- Revoked device devices API401 DEVICE_REVOKED; sync clears linked state and keeps local profile data.
- Synthetic account/private artist retained; no existing records deleted, no payment, no credentials logged.

Transport detail: Node environment-proxy read-only smoke eventually succeeded. Expanded flow used a temporary curl-backed fetch adapter, HTTPS allowlisted to the staging Worker /api/ only, no redirect following, 15s per-request limit, auth headers supplied through stdin rather than command arguments. This exercises actual account-client logic and remote D1/API, not two physical browsers or mobile QR camera scanning. Earlier silent/interrupted run is superseded by this completed expanded run, not retroactively marked passed.

## Local regression PASS
Four new account-sync-conflicts.test.cjs cases cover independent profile-field merge, explicit conflicting field choice with non-conflicting local data retained, continued typing during an in-flight save preserved and sent next sync, and disconnect preventing stale response overwrite. Included in CI.

Additional existing Worker/SQLite suites passed: claim/ownership lifecycle (including revocation and transfer interruption), public visibility/private metadata, private profile drafts/concurrent revision conflicts/review recovery, Press Kit publication privacy, FREE/PRO permission and expiry preservation, free inquiry recipient isolation, workspace autosave and interrupted publication recovery. Local mirror results do not independently establish deployed binary identity.

## Browser access observation
Prior shared browser tabs were no longer available. A new Mi perfil tab showed a genuinely unlinked browser session and explicit QR/code guidance; no credentials or private storage were inspected. This is an unauthenticated-session observation, not evidence of spontaneous account loss in an existing physical user session.

## Focused release gates for this sector
| Gate | Status |
| --- | --- |
| Creation, automatic account link, private editor, inquiry arrival/read | Actual staging browser passed in ARTIST-ACCOUNT-BROWSER-FLOW-20261016.md |
| Two approved device clients see same private artist; revoke one preserves other | Actual remote client/API passed in this run |
| FREE/PRO/FREE tools, draft retention, expiry editor | Actual staging browser and isolated tests passed in prior checkpoint |
| Conflict-safe synchronization and edits during save | New isolated tests passed; two physical-browser conflict UX not certified |
| Real verified bank activation, renewal and official ARS quote | Provider integration/configuration still required; simulated adapter tests only |
| PDF export/print and physical mobile/tablet/TV layout | Still unverified |
| Account recovery/rotation full browser journey and user-facing deletion/recreation | Still requires dedicated end-to-end verification; do not infer from token/ownership unit tests |

No claim of production readiness or complete Mi perfil sign-off.
