# Single-video feedback — 2026-10-17

Existing shell, audit branch only; no Worker changes, production deployment, payments or catalog writes.

Single YouTube video frames previously exposed no official API state/error monitoring. Added enablejsapi/origin and explicit strict-origin-when-cross-origin referrer policy, plus a dedicated event feedback adapter; playlist frames keep their existing independent controller. Uses official https://developers.google.com/youtube/iframe_api_reference event contract.

Feedback distinguishes initial loading, ready/native Play prompt, actual playing event, pause, buffering, end, missing/non-embeddable source and retryable failure. Twelve-second advisory timeout does not diagnose bot/region/provider failure and never asserts successful playback. Autoplay rejection asks the user to press native Play. Explicit retry replaces only the single-video frame; existing external current-video source link remains available. Closing/replacing frame disposes timers/feedback and ignores stale callbacks. No restriction bypass, media download, audio extraction or automatic alternate source switching.

17 local tests passed: 6 new state/embed tests plus source links and playlist queue regressions. Syntax passed. Full CI and real staging adapter UI behavior remain pending frontend deployment. No new Worker deployment is required for this frontend change.

Public thumbnail diagnostic: a HEAD request for a known ytimg thumbnail in this execution environment returned HTTP 200 but Content-Type text/html and length 195, not an image. This is evidence of an environment/source delivery mismatch, not proof that all users experience it or that application image mapping is broken. Do not introduce a proxy or change catalogs based on this alone.

Real video progression is still unverified in cloud browser; previous native player remained at zero with readyState zero. Final demo gate requires actual elapsed playback and recovery on intended devices. State UI improvement must not be described as solving that playback gate.
