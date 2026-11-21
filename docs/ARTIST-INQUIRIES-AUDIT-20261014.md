# Artist inquiry delivery and authorization — 2026-10-14

Reproduced: ownerless legacy artist invitation could read inquiries despite a different active owner. Inquiries now use the shared finite-expiry/current-owner permission verifier and fail closed without D1 ownership verification. Public booking submission also respects the shared hidden/suspended visibility policy; FREE artists remain eligible without PRO or commission.

Actual Worker + isolated SQLite PASS: public synthetic inquiry reaches correct FREE artist; anonymous full list and private inbox denied; another artist sees no inquiry and cannot PATCH its id; correct artist persists read state; invalid states denied; active-owner conflict invalidates legacy permission; suspended artist rejects new inquiry. Linked account notifications include the pending inquiry only for its owning artist account and stop treating it as pending once read. Ownership/visibility regression tests and syntax also pass. No real inquiry or client details used.

Limits: recipient response messaging/email/WhatsApp action and browser form flow not exercised; state transitions are not a confirmed contract. Concurrent submissions still append a KV array without a D1 insertion transaction and need further review. Not deployed to staging/production, main unchanged.
