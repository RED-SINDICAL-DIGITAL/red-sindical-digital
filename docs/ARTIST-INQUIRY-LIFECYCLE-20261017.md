# Artist inquiry lifecycle — 2026-10-17

Existing audit branch only; frontend repair. No Worker, permissions, payments, messages, public publication or production configuration changes.

## Findings

Inbox mounting registered account/storage listeners for each render, without explicitly disposing the prior same-host mount. Requests and detached row references could outlive tab replacement, and a malformed item list could replace the valid cached list before rendering failed. Source inspection identified these cases; no claim of observed production data exposure.

## Changes

WeakMap tracks one mount per host. Remount cancels the previous lifecycle and pending fetch. A direct-child observer detects section replacement; detached-host checks also dispose on delayed completion. Disposal clears retained item state, removes account listeners, aborts pending requests and disconnects observer. All render/update paths verify the current DOM mount and account. Existing owner-pinned requester remains unchanged.

Refresh validates item objects, string identifiers and supported states before replacing the prior list. Missing state defaults to Nueva/pendiente; incomplete refresh preserves the previous list and filters, explains retry and enables Actualizar. Duplicate refresh clicks remain serialized. A failed status PATCH restores the prior selection; successful PATCH only changes stored status, never sends messages.

## Validation

Syntax passed. 13 local VM tests passed: seven full-module DOM/fetch lifecycle cases, three account isolation checks and three artist session renewal checks. Full-module cases cover remount/stale result, section exit, detached host, malformed refresh, duplicate refresh/network failure, failed/successful status save, account switch cleanup. Actual Worker + SQLite integration passed for free inquiry delivery, recipient-only private access, persisted states, invalid state rejection and active-owner/suspension safeguards.

Manual updated. Full GitHub CI and live authenticated browser validation of this frontend revision remain pending. No test-only account was created; prior cloud browser private session is unavailable. Do not describe the new UI lifecycle as end-to-end verified until reopening a linked account and exercising its inbox.

## Initial profile tools flicker

Actual guest browser observation showed Herramientas de artista in initial Mi Perfil HTML and its disappearance after account verification completed. Fixed initial markup to hide unchecked tools and use the current Soy artista > create/claim route from the start. Verified independent legacy artist access explicitly reveals its tools; denied or account-stale responses never do. No permission is granted by this visibility change. Six public-link/tool tests passed, including two new legacy success/denial cases. Final browser verification of the changed initial markup remains pending Pages update. Current guest browser has no linked account, so authenticated inbox UI is still unverified.

## GitHub and live Admin checks after secure sign-in

Both GitHub checks at 14b55bde62a870ad1919c95b00092aaa70569971 passed: Platform integration 643 and Job status 311. Combined local inbox/access/tool suite passed 19 tests.

User completed secure Admin staging sign-in; dashboard positively showed Administrador/Sesión central. Artists catalog contains 10 synthetic records. Opened existing QA DEMO PERFIL 1700 (ART-266d08434699460d82fd6b042a47df23), initially Pendiente/Oculto/No verificado/Gratis with empty expiry. Temporarily selected PRO activo through 2026-10-18 and saved. Table and reopened modal both retained exact date and PRO; artist remained hidden and unverified. Anonymous public/artista returned 404 during the temporary PRO check. Restored Gratis and empty expiry, saved, and re-opened to confirm both plus unchanged Pendiente/Oculto/No verificado. No publishing, affiliation, payment, messages, new account or data deletion. Payment-settings read confirms enabled false.

This proves Admin manual PRO flag/expiry persistence and restoration, not bank fulfillment or artist-side PRO editing. Artist account browser session remains unavailable, so new authenticated inbox lifecycle still requires a browser run. Initial guest tools flicker fix remains pending live initial-markup verification.

Served staging /usuario HTML now confirms artistTools initially hidden and artistProfile points directly to /soy-artista.html. This is served-markup verification, not a simulated slow-network/physical-device flicker test. Saved Admin screenshot records restored Gratis/empty expiry/Pendiente/Oculto/No verificado; closed modal afterward. Admin tab retained for the next authorized review.
