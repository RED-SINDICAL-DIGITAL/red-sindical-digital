# Cartelera loading and accessibility — 2026-10-19

Audit branch only. No Worker, production, payment or catalog writes.

## Browser evidence before correction
Staging Cartelera opened publicly in the shell with generic hero, filters and zero events. Accessibility tree exposed unnamed date/location/search fields and symbol-only hero/featured navigation, including an unnamed pagination dot. No event was submitted. Operator account linking remains incomplete; no credentials or operator grants were created here.

## Correction
The two event sources formerly swallowed errors independently and rendered zero events when both failed. Cartelera now accepts only array-shaped source payloads, distinguishes unavailable sources from a legitimately empty agenda, and shows an explicit retry on failure of both. One successful source remains usable if the other fails. Optional slider configuration failure does not block the agenda. All three reads begin in parallel. Duplicate identities merge with catalog data taking precedence while preserving territorial fields supplied by the federated feed.

Added accessible names to search, category, location, date, ticket type, back and carousel controls; dots include slide numbers. Event count announces changes.

## Validation
Six new local tests passed: both sources unavailable, valid empty agenda, malformed successful responses, single-source fallback, explicit recovery and identity/ranking merge. Existing slider mode/URL/fallback regression passed and inline script syntax passed. Added these checks and source paths to the platform GitHub Actions workflow.

No new runtime state was written to staging. New Pages deployment and post-deploy browser verification remain pending. Physical device and actual event publication acceptance remain separate gates.
