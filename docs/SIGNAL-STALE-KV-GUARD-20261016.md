# Stale KV catalog protection — 2026-10-16

## Reproduced defect

Actual Worker with isolated SQLite D1 adapter and controllable KV: publish signal A; on later signal B, KV returns a stale empty catalog while D1 already records A as published. Previous Worker returned HTTP200 and replaced the KV catalog with B only. Regression initially failed (expected503, actual200).

## Fix

Inside the acquired catalog lease, query committed published onboarding records from D1 for the same signal type. Compare their published ids/onboarding ids with the KV snapshot. If any committed entry is missing or mismatched, do not write KV; release the current attempt back to approved and return HTTP503/CATALOG_SNAPSHOT_STALE with a clear retry message. No automatic reconstruction or deletion of catalog records.

## Validation

- signal-publication-lease.mjs PASS: stale read rejected before write; existing A preserved; request B returns to approved; fresh KV retry succeeds with exactly two entries. Existing lease expiry/newer ownership/recovery checks pass.
- signal-migration-integration.mjs PASS.
- signal-review-integration.mjs PASS.
- staging-signals-browser-flow.mjs PASS (local Worker + SQLite/VM diagnostic, not actual remote browser).
- Worker syntax PASS.

Worker commit aa8d4b35178ec1a9472795ad8e1cd9849398c629; blob03a02b7c9e92a63b428ac61e12ddb50242f9588e. Regression commit d5cf2d995ae0418fff1c69ada125c5c10727fbef.

## Deployment and remaining limits

Owner reported deployment to uadav-api-staging on 2026-10-16. The remote read-only smoke test passed afterward: D1/KV health, enrollment closed, anonymous private endpoints denied. This does not independently identify the deployed Worker binary or validate its new stale-snapshot behavior. Production was not deployed. Authenticated actual D1/KV publication tests remain pending.

This is a fail-closed guard, not a global D1/KV transaction. It protects committed onboarding publications represented in D1. Mixed catalog writers outside this flow and a delayed KV write completing after lease expiration remain unresolved. If an Admin intentionally removed a previously published onboarding entry without reconciling its D1 application, publication will be blocked until that inconsistency is reviewed. Do not bypass guard or erase records automatically.

## Follow-up validation

Radio and TV now each run all five lease/recovery scenarios (ten total), passing locally; test commit e876ca48715b5935202d3b15681871eb8f9e4757. Staging build now includes only tests/staging-signals-diagnostic.html, without traversing/exposing other tests. Five build isolation tests pass. Platform integration checks job 116863345813 for commit 50c7251ee5bff8fac3e2f393322ab82f0f0fc163 completed successfully, including SQLite integration, Worker syntax and staging build. Live diagnostic page rendered successfully at /tests/staging-signals-diagnostic. Secure Admin credential request was declined; no authenticated publication test was executed in this follow-up.

## Actual remote integration PASS — 2026-10-16

Secure browser credential entry succeeded; the diagnostic executed against uadav-api-staging with actual Cloudflare D1/KV. All 19 visible checks passed: protected inbox, closed enrollment, two synthetic KV applications, migration preview and execution to D1, pending publication rejected, independent approval, Radio and TV publication, exactly one successful concurrent TV publication with the other conflicted, duplicate retry rejected, exactly one catalog copy each, and final D1 published states. Enrollment stayed closed. Two synthetic radio/TV records remain in staging; no production changes or existing data deletion. Credential input was cleared by the diagnostic.

This verifies the normal remote publication lifecycle and duplicate/concurrent attempts on one TV application. It does NOT inject stale KV reads remotely, prove cross-application/mixed-writer safety, test delayed writes after lock expiry, or verify media playback. Those limits remain open. Local stale-read regression evidence remains separate.
