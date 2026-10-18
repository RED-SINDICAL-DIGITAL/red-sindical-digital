# Public search and artist profile browser audit — 2026-10-18

Environment: isolated staging. Production and payments unchanged.

## Observed in Chrome
- Search Masterboy returned 24 results; Load more increased this to 46 while retaining existing results.
- Opening Masterboy - Topic loaded the public artist profile. Videos appeared after asynchronous content hydration; the Videos tab exposed additional content and a further pagination control.
- Several identically titled uploads have different YouTube thumbnail IDs. This is not sufficient evidence to remove them as duplicates.
- Official video IBnshjEceKA opened one embedded player and native YouTube controls (3:58 duration). After user-style Play and one explicit application retry, playback remained at time 0, readyState 0, error null. The application displayed its retry and external YouTube actions. Actual playback is NOT verified; cause is unresolved.
- The profile's Volver button navigated to artistas.html instead of the originating search. Source confirms a hard-coded artist-directory destination. This remains an open navigation defect; returning to the search should preserve its query and loaded pages.

## Source correction
Commit 1c1fe3a935174b75b18763abc7d5ae3d63bc9719 omits the biography paragraph when no nonblank biography exists, retaining the category pill and authored biographies. This removes the automatic duplicate Artista description. Deployment and visual confirmation of this change are pending.

## Validation
17 existing tests passed: artist library pagination, navigation/follow and shell routing. These tests do not certify actual YouTube playback or the newly identified search return path.

## Remaining gates
- Correct search return navigation with browser verification and regression coverage.
- Verify real embedded playback on a normal supported user device; diagnose the time-0 result without assuming its cause.
- Radio Studio operator end-to-end test requires an authorized operator account and confirmed access grant.
- Physical mobile/tablet/Smart TV checks remain separate from desktop Chrome.
