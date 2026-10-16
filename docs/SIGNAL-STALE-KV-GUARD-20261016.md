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

Not deployed to staging Worker or production. Frontend branch auto-build does not update Worker. Must update only uadav-api-staging and perform actual D1/KV tests before proposing production.

This is a fail-closed guard, not a global D1/KV transaction. It protects committed onboarding publications represented in D1. Mixed catalog writers outside this flow and a delayed KV write completing after lease expiration remain unresolved. If an Admin intentionally removed a previously published onboarding entry without reconciling its D1 application, publication will be blocked until that inconsistency is reviewed. Do not bypass guard or erase records automatically.
