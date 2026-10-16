# Account → artist → private tools, actual staging browser

2026-10-16: complete public UI start at soy-artista. Created one synthetic free account using Crear mi cuenta y continuar (no credential read/copied). Searched unique QA EXPERIENCIA 1610 before creation; no result, offered create. Form: Ilusionismo, Ciudad ficticia QA, qa-experiencia-1610@example.invalid. Submission confirmed profile created, private draft pending publication. No YouTube needed.

Mi perfil automatically displayed linked artist ART-e59bee06d32745e9911761e86d5f595f and Abrir mi espacio / Mi presentación y herramientas; no private token link entered. Tools opened from account, artist identity matched; no-PRO read mode and disabled writes as expected. Consultas recibidas opened management by artist_id, confirmed Acceso desde tu cuenta, free consultation inbox loaded zero entries. Full shell reload preserved artist_id, consultas tab and access; inbox finished loading successfully. No payment or PRO promotion, public publication, external email or WhatsApp sent. One synthetic account/profile/request remains in staging; no existing data deletion or production change.

Limits: empty inbox access verified, not end-to-end arrival/reply to an actual consultation for this new artist. Earlier API/SQLite recipient tests are separate. No second physical-device linking tested. PRO tools editing remains separately tested, no real bank activation.

Latest Platform integration checks run38938054686 / job117098414698 completed successfully before this browser check. Includes profile, PRO, payments simulations, session isolation, PWA and Radio tests; not proof of all live production behavior.

## Public booking → private artist inbox PASS

Authenticated Admin temporarily published only synthetic ART-e59bee06d32745e9911761e86d5f595f in staging, then public booking UI submitted CLIENTE FICTICIO QA1610, qa-consulta-1610@example.invalid, event PRUEBA ENTREGA1610, fictitious city and explicit non-contract test details. No fee/date/WhatsApp or binding commitment. Success reference CON-0bc7932369f644734ef63bb4af681c9d09c5b3526a191f4b5599aeeaedc27348. Form reset after confirmation. Immediately restored artist hidden (Admin visible Oculto/oculto); original new-claim review remains separate and pending. No other artist changed.

Private FREE inbox refresh showed exactly one new consultation with matching event, requester, message and reference. Changed state Nueva→Leída through artist UI. Full reload retained session, same consultation and Leída, count1received/0new. Email link not clicked; no external reply/message sent. Confirms real Cloudflare delivery and status persistence for account-linked artist, including continued private access after profile hidden again.

New UX finding: public booking URL with an existing hidden artist id still renders an editable form with raw artist id, instead of prechecking visibility and displaying a clear unavailable message. Backend visibility denial is covered by isolated tests; no hidden-profile submission was attempted in this browser run. Frontend availability precheck remains to repair; do not claim full form UX complete.

## Booking availability UX patch

Frontend commit4137148e017f4ea25faa253a8cbe002cd65953d6 checks existing public/artista GET before enabling personal fields and submission. Public profile must have an id, visible not false and marketplace_enabled not false. No PRO requirement. Heading uses textContent with public artist name; unavailable/404/403 and network failures disable fields and show a retry control with15s request timeout. Missing id never requests API. Submit also guards artistReady; backend continues authoritative checking if visibility changes later. No new Worker required.

Eight new availability tests plus three existing booking retry tests pass; inline syntax passes. Platform CI job117110771099 completed successfully for integration commit1eeba22d424bf613e83dea2f223f63c83266baad. First browser reload still served prior form during Pages propagation; do not count that as a passing test of the patch. Live UI confirmation remains pending at this checkpoint.

## Booking availability actual staging UI PASS

Pages manifest confirmed source4137148e017f4ea25faa253a8cbe002cd65953d6. Reload on the hidden synthetic artist showed the unavailable message before fields, all personal inputs/accept/submission disabled and Comprobar de nuevo available. Temporarily published only this synthetic FREE artist through Admin; clicking Comprobar de nuevo enabled the form without reload and heading Consultar a QA EXPERIENCIA1610. No new inquiry submitted. Restored profile hidden immediately and reloaded: unavailable message and disabled controls returned. Production untouched. Prior checkpoint's pending browser confirmation is now completed for hidden→public FREE→hidden UI; real network-timeout/retry behavior remains separately VM-tested.
