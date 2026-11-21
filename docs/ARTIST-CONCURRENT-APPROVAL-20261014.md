# Competing artist approvals — 2026-10-14

Reproduced with the actual Worker + isolated SQLite: two different account claims against the same existing artist, both administrator approvals explicitly confirming the pending conflict, and both early owner reads forced to observe no owner. Before the correction both returned 200.

Correction: D1 batch reserves the active owner using a conditional INSERT/UPDATE and transitions the matching claim to approved before invitation/catalog writes. It rejects stale claim state, another active claim owner and attempts to reactivate a revoked owner. A rejected claim must be reopened before approval. Existing matching active-owner approvals remain retryable for downstream reconciliation. No schema migration or existing-record removal.

After correction the deterministic competing test returns one 200 and one 409 with one active owner. Repeating an old approval after owner revocation returns 409. Existing draft rejection, account linkage, unrelated-account denial, private invitation/session revocation, FREE/PRO, payment fulfillment, bank adapter/recovery and 29 node:test cases pass locally; syntax passes. Test already included in CI; latest CI completion not checked.

Limits: publication/catalog remain derived KV writes and can fail after the D1 approval. Retry reconciliation and transfers interrupted across writes need dedicated coverage. This protects normal competing approvals; it does not serialize all other ownership writers such as transfer and new-draft creation. Further audit is needed for those paths. Not deployed to staging or production; no main merge.
