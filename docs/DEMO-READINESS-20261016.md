# Demo readiness — 2026-10-16

Goal: a demonstrable subset of the existing platform; bank collection/real transfer fulfillment is the final phase. No production deployment or merge authorized.

## Evidence and remaining gates

| Circuit | Evidence | Remaining gate |
| --- | --- | --- |
| Public artist discovery | Real staging MasterboyVEVO opens with channel portrait and 29 official API videos | Verify other artist/channel forms; thumbnail fallback observed |
| Search | Real browser Masterboy 25 then 41 results | Mobile timing and search-to-back navigation |
| Artist library | Real channel Videos and empty Playlists response; isolated pagination tests | Actual populated playlist playback and recovery |
| Single-video playback | Native YouTube player opens; zero seconds/readyState zero in cloud browser | Playback must advance on target devices before claiming it works |
| Account/device linking | Real staging API integration with two independent credentials passed; prior browser account creation/link/save passed | Current full browser/physical second-device journey |
| Artist workspace | Prior real staging FREE draft and inbox verified; temporary PRO kit edit tested then FREE restored | Reclaim existing profile, public kit publication and account recovery full UI |
| Radio | Prior remote stream playback/navigation evidence | Repeat persistence and mobile playback in release candidate |
| Cartelera/Jobs | Existing modules preserved | Current create-to-publish/apply-to-inbox demo smoke test |
| Payments | Disabled; isolated fulfillment tests exist | Real bank checks LAST; do not collect during demo |

## This increment

- Fixed observed MutationObserver exception when iframe has head but no body yet.
- Legacy artist fallback uses configured API base instead of production hardcode.
- Aborts prior fallback search, rejects stale query results/detached grids, eliminates duplicate Enter/submit request path, and distinguishes HTTP failure from no matches.
- Shell provides a canonical Open in YouTube link for current video/playlist, removes it on close or unrelated media. Source URLs are constructed from validated IDs rather than arbitrary outbound strings. This is an explicit escape route, not certification of embedded playback.
- Local syntax and 12 VM-based tests passed (frame/search, source links and artist shell route isolation). CI and live frontend behavior for this increment require verification after staging auto-build.

## Demo release order

1. Finish artist discovery, image/error states and actual playback; preserve source restrictions.
2. Repeat account create/edit/device link, FREE artist creation/edit/inbox, PRO tools using simulated entitlement only.
3. Repeat press kit share/print and navigation/back on mobile and PC.
4. Smoke-test Radio, Cartelera and Jobs with identified synthetic records.
5. Record known limits, verify staging build identity separately from Worker. Obtain explicit approval before production release. Staging contains fictional records and must not be advertised as production.
6. Only after web app demo acceptance configure and test real bank payments.
