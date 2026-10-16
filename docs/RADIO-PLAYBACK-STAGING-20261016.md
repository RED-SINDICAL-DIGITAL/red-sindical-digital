# BEAT playback — actual staging browser, 2026-10-16

Owner supplied https://stream.zeno.fm/9s7nnwmknkhvv. A bounded HTTP check received 200, audio/aac and 8099 bytes; response body cancelled immediately. Zeno redirects to a temporary signed host; only original stable URL stored. Do not persist the signed destination.

Authenticated staging Admin created BEAT DIGITAL RADIO · PRUEBA, id RAD-MVB7AHVS-TP0Y, active, no featured placement/pauta, Argentina, description identifying staging. Existing two synthetic radios preserved. No production changes.

Actual Chrome staging shell playback: click BEAT from Radio hub, one top-level radioAudio with paused:false, readyState:3, error:null and currentTime 5.170998. Navigation to Artistas retained same element id and advanced to12.249117. Pause changed paused:true at23.952873; subsequent read remained23.952873. Volume slider changed from0.85 to0.3 (UI observed; audio volume property not returned by browser evaluation, so actual volume change not independently certified). Resume and browser Back returned to Radio while same audio advanced to26.424363, paused:false, error:null. Dock showed Leo Sayer — More Than I Can Say. Closing dock removed player UI, unselected station, and paused audio without error. Listen ended.

Direct navigation to stream was blocked by this browser client (ERR_BLOCKED_BY_CLIENT), but media playback inside the existing staging app succeeded. This was not a provider outage. No bypass/proxy added.

Limits: browser decode/clock advance verified, not human listening fidelity; no physical mobile/tablet/TV testing, background lock-screen behavior, long duration, reconnection, station switching or mute verified yet. Test radio remains in staging. Worker/frontend code unchanged during playback test.
