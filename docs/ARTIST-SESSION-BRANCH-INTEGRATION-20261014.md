# Private artist session branch integration — 2026-10-14

Compared gestionar-artista.html on audit/public-job-status-20261012 (blob ebdbd5360cf9961783654317b10cd40a454cd436) with fix/artist-session-main-20261011. Changes were limited to API response handling, pinned renewal, API-relative retry path, content renewal wrapper, linked token validation/persistence and initial token persistence. Integrated these into the audit branch without merging either branch/main or deploying.

Additional audit guards: mutation transport errors do not fall back to another API; page captures its account identity and checks before requests/after response parsing; intentional preparePayment account creation adopts the resulting identity explicitly. Account script version reference updated on this page; other consumers still require coordinated cache/version review.

PASS: 14 actual helper behavior tests (7 retry URL cases, 3 pinned identity/revocation cases and 4 management API account/replay cases), plus inline page syntax. Existing source-branch tests now run in audit CI. This does not prove browser editing/painting, Cloudflare deployed behavior or all modules. Current CI run not yet checked. Remote staging Worker and production remain unchanged.
