# Artist integration results — 2026-10-14

## Real Cloudflare staging

PASS: tests/staging-artist-integration.mjs against uadav-api-staging.uadavstream.workers.dev/api/. One synthetic account and artist draft retained. Verified: public payment settings disabled before testing; account creation; authenticated new artist draft without YouTube; deduplicated resubmission; automatic single account link; private unpublished draft; artist session and matching identity; FREE plan; workspace readable but PRO editing denied; unrelated artist session denied; unpublished public Press Kit returns 404; unlink succeeds and both session issuance and already issued workspace access are denied. The unlink affects only the synthetic test link. No existing records deleted, no credentials logged, no production requests.

This is not approval of a claim over an existing public artist: that requires administrative review and was not exercised remotely because the staging admin secret is held only by the user.

## Actual Worker with local SQLite

PASS: tests/artist-pro-integration.mjs. Verified FREE read/write separation; anonymous-to-admin privilege denial using artist credential; administrative PRO activation on synthetic data; PRO workspace save; stale revision conflict; expiration returns FREE behavior while retaining saved presentation; expired PRO save denied; payments remain disabled. This test does not verify bank reconciliation, a real payment, remote D1 PRO fulfillment, public publication/moderation or responsive visuals.

Added deterministic PRO test to CI. Remote staging script is intentionally not run in CI by default. No frontend deployment, main merge or production changes. Next: inspect payment fulfillment idempotence and public Press Kit expiry behavior; then responsive UI and real artist-claim approval in staging.
