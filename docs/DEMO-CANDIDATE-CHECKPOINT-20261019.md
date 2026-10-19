# Demo candidate checkpoint — 2026-10-19, Argentina

Existing platform, audit/public-job-status-20261012. Demo before final version; payments last. No production merge, deployment or payment activation.

## Current live desktop acceptance
| Circuit | Current evidence | Limits |
| --- | --- | --- |
| Bolsa de Trabajo | Public synthetic opportunity → moderation → exact Admin review/approval → public listing → synthetic application → receipt tracking → Estado: pendiente → matching Admin application | PC Chrome only. No actual hiring, remuneration, real applicant data or email messages. |
| Cartelera | Public free synthetic event → moderation reference → exact Admin review/approval → public list → detail with 2026-12-01 20:30 → return → paid filter 0/free filter 1 | No paid highlight, tickets or real event. Generic hero display and named controls verified; first-paint latency not measured. |
| Radio public playback | Authorized BEAT DIGITAL RADIO · PRUEBA. Audio currentTime 5.840669 seconds, readyState 3, paused false, error null. Navigated Radio → Trabajo and time reached 11.848063. Pause confirmed paused true. Resume reached 18.926586, readyState 4, paused false, error null. Close hid dock, paused audio and removed src. | This is actual browser media progression, not just a play icon. Does not certify physical mobile/TV, stream outage recovery in this run, or operator Studio. |
| Search/back | Previous live Masterboy 24→46 results, profile → Volver retains all 46 | Actual embedded video still stalls at zero in cloud browser. |

## Demo fixtures left in isolated staging
- Job JOB-MVF8XT4Q: DEMO QA · Convocatoria ficticia 19-10-2026. One synthetic application. Private receipt key was not read or logged.
- Event EV-MVF91D41: DEMO QA · Evento ficticio 19-10-2026. Free, fictional venue, no purchase link or feature request.
- Both explicitly labeled not real and suitable only as staging demo fixtures.

## Changes derived from the acceptance work
- Initial Cartelera generic hero is present in HTML without waiting for API/image; deployed source checks and actual generic hero verified.
- Loading errors no longer masquerade as empty Cartelera; retry and accessible controls added.
- Job publication now includes receipt reference and validates moderation envelopes before clearing the draft. 22 UI/contract tests and isolated Worker+SQLite/KV integration passed. New source deployment is a separate check.
- Radio Studio clears private views on rejected access and cross-tab storage clearing; 27 UI tests plus isolated integrations pass. Not yet an authenticated operator browser test.

## Remaining demo gates
1. Account/artista: authorized existing account session; revalidate edit/reopen, inbox and Press Kit. Device linking still incomplete in this browser. Do not infer success from credential form submission.
2. Radio Studio: actual authorized operator session; any new access grant must be explicitly confirmed for the exact account/station before granting. Central Admin login is not an operator login.
3. Video: actual elapsed YouTube playback and playlist recovery on intended device. Do not describe zero-time cloud-browser result as fixed.
4. TV/IPTV: approved playable signal and full current-candidate flow; do not play synthetic NO REPRODUCIR test signals.
5. Physical mobile/tablet/Smart TV acceptance. Desktop responsive mocks and local tests do not replace these.

Keep public media discovery, ordinary Cartelera, jobs and hiring open/free. No STREAM+, no platform hiring commission, Ticket disabled. Do not enable real bank collections, featured payments or PRO charge fulfillment until demo acceptance.
