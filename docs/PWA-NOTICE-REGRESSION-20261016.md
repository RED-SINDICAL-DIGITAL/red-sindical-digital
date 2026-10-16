# Update notice persistence — 2026-10-16

Found: reload-attempt marker was sessionStorage-only, allowing the same offered build to prompt in another tab when stale frontend code persisted. Update action now writes the same build marker to localStorage and check reads it as well as the legacy session marker. Only that exact offered build is suppressed; newer build numbers remain eligible. This is notification acknowledgement, not installation verification. It neither deletes caches nor changes service workers or account data.

Later action gains an in-memory fallback when storage is blocked, preventing focus/online checks from immediately showing the same notice again within the current page. No cross-tab persistence can be guaranteed if browser storage is unavailable.

Four complete-script VM tests pass: installed version excluded, attempted update survives a second tab and newer build still prompts, Later survives second tab, blocked-storage Later survives focus. Added to CI. Browser tests with an actually newer offered build remain pending; do not change production version.json solely to test. Production unchanged.
