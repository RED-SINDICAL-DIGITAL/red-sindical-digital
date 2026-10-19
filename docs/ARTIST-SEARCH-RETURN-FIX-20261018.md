# Artist search return — 2026-10-18

Public search links carry a local return route. Artist Back accepts only same-origin search/directory paths with a q parameter, otherwise falls back to the directory. Private routes and token-bearing return URLs are rejected.

The last completed public search result set, next cursor and filter are retained in session storage, bounded to 1 MB and ten minutes. Invalid, expired or unavailable storage falls back to normal search. No account credentials are stored by this feature.

Navigation context avoids firing input when the restored query already matches, preventing delayed pagination resets. Direct profiles still return to the directory.

23 local tests passed: search return, navigation/follow, pagination and shell routing, including inline syntax compilation. Browser verification after Pages deployment remains pending. Worker and production unchanged.
