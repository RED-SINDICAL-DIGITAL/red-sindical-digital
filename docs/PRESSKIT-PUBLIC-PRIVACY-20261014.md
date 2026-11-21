# Press Kit public data minimization — 2026-10-14

Reproduced: hidden contact remained in public API JSON even though the renderer hid the section. Correction adds an explicit public projection for new snapshots and public reads (including older snapshots). Only public kit/show fields are allowed; hidden contact/trajectory/video/shows are omitted; show prices, quotes, agenda and leads never appear in that API response. Public artist id is taken from the requested/authorized artist, not arbitrary stored JSON. Private workspace data is preserved. Moderation text is based on the public projection rather than hidden trajectory/show content.

Actual Worker + isolated SQLite test PASS: hidden marker absent from newly stored public snapshot; seeded legacy snapshot filtered at read; no private client/fee/agenda/lead values; private workspace requires auth and keeps data; draft edits do not alter published version; pending moderation preserves earlier version; unpublish returns public 404 while private content remains; response no-store. Existing FREE/PRO, ownership lifecycle and syntax checks passed. CI added, current run not checked.

Scope: public/presskit API and publication snapshot. Separate sharing/SEO metadata and rendering/export paths still require review for consistent privacy. No production data inspected, no staging/production deployment, no main merge.
