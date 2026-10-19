# Artist content reliability — 2026-10-17

Scope: existing artist editor and content endpoint, audit/public-job-status-20261012 only. No production merge or deployment; payments disabled.

## Editor

Previous submit handler allowed simultaneous submissions and updated contentStatus/reset form after navigation. Content listing also accepted stale responses and overwrote a new view. Added per-form busy guard, preservation of prior disabled controls, dirty-change protection using existing tab guard, cancellation of edit, current account/artist/form identity checks, list generation checks and malformed-response handling. Failure retains entered values for retry. Type labels now readable; media URL uses browser URL validation. No backend idempotency claim: an interrupted successful request still requires checking sent content before retry.

Validation: inline JavaScript syntax passed; 21 local VM tests passed, including 6 new content cases and existing management/account/link regressions. Actual Worker + SQLite draft regression passed. Current browser content edit/save journey remains unverified: cloud browser session restarted and lost its local test account. No duplicate account created this turn.

## Content visibility defect

A synthetic test against the actual Worker demonstrated anonymous /api/artista/content?artist_id=... returned previously published media after its artist profile became private. Initial assertion failed before the fix. Now anonymous listing requires an existing publicly visible artist, including suspension checks, and still returns only approved media. Authenticated active owner can read their own private/pending content regardless of a supplied foreign artist_id; revoked owner gets 403.

Validation after fix: actual Worker + SQLite content visibility test passed; public profile visibility and private draft lifecycle tests passed; syntax passed. This backend fix is NOT yet proven deployed to staging. Separate staging Worker deployment required. Existing bank settings and catalogs are unchanged.

## Prior fix status

GitHub Actions at fd96eff1b607d855b90912d54423845c6285c12a completed successfully: Platform integration 589 and Job status 293. The public-link UI fix has not been rechecked with the prior private account because browser storage is unavailable in the new browser session. Public guest Mi Perfil opens normally; this is not proof of the private account case.

## Next staging checks

Deploy updated Worker only to uadav-api-staging; replay an existing synthetic private account content create/edit/save/reopen flow; verify single POST per click sequence and no cross-view stale updates. Confirm hidden public profile and anonymous content are both inaccessible, while owner retains editor. Recheck public-link guard and current-video external source link. No real payments or publication of synthetic artists.
