# Single-video feedback — 2026-10-17

Existing shell, audit branch only; no Worker changes, production deployment, payments or catalog writes.

Single YouTube video frames previously exposed no official API state/error monitoring. Added enablejsapi/origin and explicit strict-origin-when-cross-origin referrer policy, plus a dedicated event feedback adapter; playlist frames keep their existing independent controller. Uses official https://developers.google.com/youtube/iframe_api_reference event contract.

Feedback distinguishes initial loading, ready/native Play prompt, actual playing event, pause, buffering, end, missing/non-embeddable source and retryable failure. Twelve-second advisory timeout does not diagnose bot/region/provider failure and never asserts successful playback. Autoplay rejection asks the user to press native Play. Explicit retry replaces only the single-video frame; existing external current-video source link remains available. Closing/replacing frame disposes timers/feedback and ignores stale callbacks. No restriction bypass, media download, audio extraction or automatic alternate source switching.

17 local tests passed: 6 new state/embed tests plus source links and playlist queue regressions. Syntax passed. Full CI and real staging adapter UI behavior remain pending frontend deployment. No new Worker deployment is required for this frontend change.

Public thumbnail diagnostic: a HEAD request for a known ytimg thumbnail in this execution environment returned HTTP 200 but Content-Type text/html and length 195, not an image. This is evidence of an environment/source delivery mismatch, not proof that all users experience it or that application image mapping is broken. Do not introduce a proxy or change catalogs based on this alone.

Real video progression is still unverified in cloud browser; previous native player remained at zero with readyState zero. Final demo gate requires actual elapsed playback and recovery on intended devices. State UI improvement must not be described as solving that playback gate.

## Live frontend verification, 02:39 UTC

Staging manifest sourceCommit 04bf15b2d5b45dcb7363371f65d6e3d49ea91ffb includes uadav-video-feedback-v151.js. Both GitHub checks at that commit succeeded (Platform 610, Job status 300). Local total became 18 after an additional adapter lifecycle test (retry replacement, stale event rejection and cleanup).

Real browser: public MasterboyVEVO > Show Me Colours official video. New iframe exposes enablejsapi=1 and correct staging origin. UI showed Preparando video, then native Play prompt. After slow load it displayed La carga está tardando and Reintentar video. Clicking retry replaced iframe id uadav-single-video-1 with uadav-single-video-2, reset Preparando video and retained profile and external source link; application URL unchanged. Successful playback not observed; remains a release gate. Clicked Close after the retry test: media card, iframe, feedback message and retry button disappeared from the actual browser accessibility tree. Screenshot captured the slow-load/retry state before closing.

Inspected Press Kit shared renderer: its embedded YouTube iframe already specifies strict-origin-when-cross-origin, overriding the page's no-referrer for this embed. No Press Kit code changed in this increment.
