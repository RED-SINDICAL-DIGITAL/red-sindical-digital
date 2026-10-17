# Expanded regression checkpoint — 2026-10-16

Scope: audit/public-job-status-20261012 only. No production changes, deployment or real payments.

## Passed locally
- 45 Node tests covering account disconnection, independent legacy access, account switching during recovery/requests, artist identity pinning, token renewal, revocation, private inbox isolation, PRO purchase readiness, duplicate purchase prevention, quote preview privacy and agenda duplication.
- pro-bank-confirmation.mjs: Worker + SQLite simulated signed bank adapter rejects invalid/expired signatures and wrong amount/currency/recipient/status; valid credit activates once; replay preserves expiry; transaction reuse/ownership changes denied; KV interruption retry reconciles.
- pro-payment-fulfillment.mjs: receipt alone does not activate; disconnected bank rejected; concurrent/repeated approval activates once; renewal stacks once; monthly/yearly feature credits 1/12.

Local mirror tests are regression evidence, not independently certified deployment identity or real bank integration. The device integration script and account client were fetched from the audit branch immediately before the remote attempt; other regression files used the existing local mirror.

## Remote device attempt — NOT VERIFIED
Started tests/staging-device-integration.mjs with explicit HTTPS staging-only API allowlist and current account client. It produced no result during this run and was interrupted (exit130). No success or specific server defect can be inferred. Request processing and any synthetic account creation cannot be confirmed from absent output. Do not automatically delete or blindly repeat synthetic writes to compensate.

## Still needed
Real two-device browser flow; bounded/time-limited network diagnostics before another remote test; bank provider integration; physical mobile/tablet/TV validation. Production readiness not established.
