# PRO expiry and reactivation — 2026-10-15

Test-only changes on audit/public-job-status-20261012. Worker source verified against GitHub blob b040e6f758c6aa7627b1650e4ec78c2eaf53a03f. No deployed Worker, plan, billing or production data changed.

Expanded tests/artist-pro-integration.mjs using the actual Worker with isolated SQLite D1 adapter and in-memory KV. Synthetic quotes (including payment notes), agenda time, leads and presentation are saved under active PRO. After simulated expiry, all workspace data exactly matches the saved snapshot; writes return 403 and public kit/share routes return 404. Simulated administrative reactivation retains data and revision; a subsequent workspace save succeeds and advances revision once.

Command: node tests/artist-pro-integration.mjs — PASS.

This validates backend behavior in an isolated adapter, not Cloudflare concurrency, bank renewal, hardware rendering or remote PDF printing. Reactivation in this test uses an admin test fixture, not a paid transaction. Previously verified browser quote/agenda persistence remains documented separately.
