# Demo Profile browser verification — 2026-10-17 UTC / Oct 16 Argentina

Environment: staging Pages/Worker only. No production changes, publication, messages or bank payments.

Frontend app.html contains the current source-link function and navigation asset version 20261016-demo. Served mobile script contains iframe body guard and configured API base. GitHub checks at 2546ae54c3f33a48d3a45b3613e97161fb2b2924 both completed successfully: Platform 581 and Job status 290.

## Real browser flow

1. Started Mi Perfil with no linked account; entered Soy artista.
2. Created synthetic free account using in-app button, then searched QA DEMO PERFIL 1700.
3. Created synthetic artist without YouTube; contact address uses example.invalid. Artist ID ART-266d08434699460d82fd6b042a47df23. This is a test record, not an actual artist.
4. App confirmed private draft awaiting publication review.
5. Returned to Mi Perfil; artist automatically appeared. Open my space worked without a private URL/token handoff.
6. Saved synthetic biography as draft; UI confirmed changes not published. Reload retained session and biography.
7. Anonymous public/artista returned 404 Perfil no disponible. Draft remains private.
8. Tools workspace opened FREE read-only, with save/publish/edit disabled and profile/consultation links available.
9. Consultations opened with zero received, no entitlement barrier and explanatory free/no-automatic-message text.

## New defect found and corrected in branch

After returning from management, legacy artist-links component displayed a public profile link for the private draft and raced the account-linked component. Reproduction visibly showed Ver mi perfil público despite private status; endpoint correctly remained 404.

Fix: legacy component exits whenever account credential exists, irrespective of component load timing. Legacy-only public link now requires successful matching public artist response, remains hidden on 404/failure, and ignores stale credential context or detached element. Artist profile asset version refreshed.

Syntax passed and 8 local tests passed (4 new link visibility/race regressions plus 4 account access tests). Added regression to CI. Final live verification of this new fix remains pending frontend staging update. No claim that new branch tests equal browser verification.

## Remaining release gates

Actual media playback advancement and thumbnail loading; physical second-device linking; current existing-profile ownership claim; public kit review/share with active simulated PRO; Cartelera/Jobs current UI circuits. Real payments remain last and disabled. Retain synthetic draft privately; do not delete or publish it automatically.
