# Bank adapter contract tests — 2026-10-14

PASS locally with actual Worker, synthetic credentials, in-memory KV and Python-backed SQLite: invalid HMAC denied; stale signed timestamp denied; wrong amount, currency, recipient and non-credited status denied before fulfillment; valid credit activates PRO; replay of the same transaction leaves expiry unchanged; one transaction cannot fulfill another order; different transaction cannot replace an already fulfilled order; mismatched current ownership blocks activation.

Failure recovery: injected one KV catalog-write error after the atomic D1 payment/entitlement commit. First request reports 503, repeat of the same signed credit returns 200, repairs the catalog and leaves expiry and one monthly feature credit unchanged. No external bank or Cloudflare resource used by this test. Test file: tests/pro-bank-confirmation.mjs; added to audit CI. CI completion still to be verified.

Limits: this is an adapter contract, not a bank connection or proof that uploaded receipts represent credited funds. Real bank/provider credentials, event delivery and retry configuration are not available. Manual approval ownership-change races, concurrent rejected/approved decisions and broader cross-product payment isolation need additional checks. Production and staging deployments unchanged.
