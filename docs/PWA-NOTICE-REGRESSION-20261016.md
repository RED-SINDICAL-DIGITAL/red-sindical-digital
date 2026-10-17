# Update notice persistence — 2026-10-16

Found: reload-attempt marker was sessionStorage-only, allowing the same offered build to prompt in another tab when stale frontend code persisted. Update action now writes the same build marker to localStorage and check reads it as well as the legacy session marker. Only that exact offered build is suppressed; newer build numbers remain eligible. This is notification acknowledgement, not installation verification. It neither deletes caches nor changes service workers or account data.

Later action gains an in-memory fallback when storage is blocked, preventing focus/online checks from immediately showing the same notice again within the current page. No cross-tab persistence can be guaranteed if browser storage is unavailable.

Four complete-script VM tests pass: installed version excluded, attempted update survives a second tab and newer build still prompts, Later survives second tab, blocked-storage Later survives focus. Added to CI. Browser tests with an actually newer offered build remain pending; do not change production version.json solely to test. Production unchanged.

## Legacy worker retirement safety

service-worker.js previously deleted every origin cache and navigated every matched window on activation. Removed the blanket deletion and forced navigation; preserve its existing skipWaiting and self-registration unregister behavior, with no fetch handler. Retained caches cannot be served by this retired worker. No offline capability was added. Separate uadav-push-sw.js and its registration remain unchanged. One VM lifecycle regression proves install/activate unregister exactly this registration, with no cache access, no client enumeration/navigation and no fetch listener. Combined PWA suite:5 passing tests. Browser upgrade from a genuinely installed old worker remains unverified; no root worker was installed just to test it in the shared environment. No production deployment.
