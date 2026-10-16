# Artist channel discovery — 2026-10-16

Staging health confirmed the configured YouTube key and enabled official API. Real browser search for Masterboy returned 25 results, then 41 after pagination. A native embedded video opened but currentTime stayed at zero and readyState at zero: playback remains unverified.

MasterboyVEVO discovery returned HTTP 404 despite working video search. Channel search and metadata still relied exclusively on Invidious. Worker now preserves Invidious first and falls back to bounded official search/channels requests when unavailable. No ownership, affiliation or PRO is granted. No bulk catalog download is introduced. Missing key, disabled API and provider errors fail gracefully.

Artist page now retries discovery rather than reusing a cached discovered profile lacking a channel reference.

Validation: Worker syntax passed; actual Worker + SQLite discovery regression passed (fallback metadata, disabled/missing key, official error, no credential exposure, no privilege grant, Invidious success makes no Google calls). Public visibility regression passed; 13 artist pagination/navigation tests passed. New discovery regression added to contract workflow. CI execution and real updated-Worker integration remain pending.

Deployment: frontend branch is staging source; Worker requires a separate staging deployment of worker.js from commit f9ce58a39a78901161535c89924911c9a4b02538. Do not deploy production or merge. After deployment retry MasterboyVEVO profile, channel library pagination and actual playback. Bank payments remain last and disabled.
