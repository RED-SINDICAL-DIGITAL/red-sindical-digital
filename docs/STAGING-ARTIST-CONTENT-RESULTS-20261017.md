# Staging artist content results — 2026-10-17 02:30 UTC onward

Staging Worker health returned 200 with D1/KV and YouTube API enabled. Build 11753 is unchanged and is not proof of exact deployed source identity. User reported deploying Worker commit 5bd4b5df3901731a35a8f36a1b8f38b7ae645bb2. No production changes made.

GitHub checks for f544581adcbd9a181fb4d7110d00f756c938ed62 both succeeded: Platform integration 598 and Job status 296.

## Actual remote lifecycle

Ran tests/staging-artist-content.mjs against the exact staging API allowlist, with a new synthetic account, private FREE artist and pending media item. No real contact information, payment, messages or public publication. Fixture retained; no deletion.

Passed: disabled bank payment guard before/after, account create and artist claim/session, content POST pending, owner GET, PUT edit, GET persisted updated title/order with same single item, authenticated supplied foreign artist_id cannot switch ownership, foreign content PUT rejected 404, javascript media URL rejected 400, anonymous private pending-content listing empty, public artist 404, FREE workspace pro false. Staging frontend CORS accepted; account routes require exact allowed origin. The first test attempt stopped before mutation because it incorrectly required an exact origin even for a public CORS-star response; assertion was corrected for public routes and the complete run passed.

Limits: This remote test does not certify double-click behavior in a browser, device persistence, physical mobile/TV, or the private-artist previously-published-content fixture. The latter regression passed against actual Worker code and SQLite locally, but remote approval fixture was unavailable without Admin. Do not equate health build with source identity or claim this full privacy scenario certified remotely.

## Browser playback controls

Opened public MasterboyVEVO, chose Show Me Colours official video. Source link appeared with canonical watch?v=rtVj-GImpZ8. Navigating to Mi Perfil minimized the same player and expanding restored its controls/source link; close removed it. Playback still at zero seconds/loading in this cloud browser; playback is NOT approved. Screenshot records the current external source fallback and unresolved media loading, not successful playback.

## Reproduction command

UADAV_STAGING_API=https://uadav-api-staging.uadavstream.workers.dev/api/ node --use-env-proxy tests/staging-artist-content.mjs

Explicitly opt-in only, not an automatic CI remote mutation. Each run retains one synthetic account/private artist/pending item. Real payments remain last and disabled.
