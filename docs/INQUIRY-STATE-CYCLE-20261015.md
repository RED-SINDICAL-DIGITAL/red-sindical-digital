# Inquiry state cycle — 2026-10-15

Actual Worker, isolated SQLite adapter and in-memory KV; no external messages, real clients, staging data or production changes.

Command: node tests/artist-inquiries-integration.mjs — PASS.

Expanded verification through Leída → Respondida → Cerrada → Nueva with a fresh read after every transition. Recipient B never sees A's inquiry. Reopening restores recipient account's unread notice. Once an active verified owner exists, the old ownerless legacy access is denied both reads and state writes (401).

Existing suite also passed delivery to free artists, private no-store inbox, recipient-specific account notifications, cross-artist write denial, invalid-state rejection, concurrent submissions, legacy KV merge, interrupted D1 insert and idempotent duplicate/replay checks.

Scope: backend integration in local adapter. This does not prove delivery of email/WhatsApp (none is sent by state changes), real Cloudflare concurrency, or a live browser query with actual client data.
