# Playlist queue recovery — 2026-10-16

Audit branch only. No production/Worker/payment changes.

Queue page validation now runs before marking cursors consumed. Null rows or invalid next_cursor cannot poison the first-page retry. Duplicate records within a page are removed by id+position, retaining legitimate repeated songs at distinct positions; player-provided fallback IDs now receive positions. Transient/non-skippable YouTube errors set queue error and trigger render so Reintentar becomes available, without marking all songs unavailable. Existing100/101/150 skip behavior retained. Playback state announcements ignore a reported video id that does not match the current queue item, matching stale error/ended protection.

Eight new queue tests passed with8 library pagination tests (16 total): malformed first page retry, duplicate rows vs repeated positions, error150 auto-advance, stale error/ended ignore, transient retry visibility/state clearing, unavailable-page pagination and terminal end, late response after close isolation, invalid cursor retry. Syntax passes. The new announcement guard is code-reviewed; queue tests do not emulate full iframe event delivery. Added suite to CI; app script query refreshed.

No actual external media was played in this run. Real YouTube playback/domain permissions, metadata, browser autoplay and physical-device background behavior remain integration gates. Sending a local notification/state does not guarantee media can embed. Banking remains the final separate release phase per user decision.
