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

## FREE private profile editing and handle

Actual artist UI saved synthetic bio BORRADOR PRIVADO QA1610 via Guardar borrador, confirmed Borrador guardado and changes not published. Full reload retained text and private banner. Anonymous staging public/artista GET returned404 and response did not contain draft marker. Did not send profile to moderation or enable PRO. Username qa-experiencia-1610 saved successfully through same FREE account; public link remains hidden. Existing synthetic profile/data retained.

Found handle-save confirmation recommended sharing even on private profile. Adjusted only confirmation to respect existing publicVisible flag: private save now explains profile remains private until published; public save keeps sharing guidance. Four handle UI regressions pass including actual mocked PUT, hidden public link and private-state message. New wording browser verification pending Pages build; preceding real handle save and draft persistence tests used prior text.

## FREE → PRO → FREE actual UI, no payment

Admin temporarily enabled PRO only for synthetic artist, keeping visibility hidden, affiliation unverified, Press Kit disabled and payment collection unchanged. Same account tools showed PRO vigente and enabled editing. Completar campos vacíos con mi perfil imported the saved FREE private bio into the Press Kit; auto-save confirmed. No publication action taken. Restored original FREE and empty expiry in Admin. Workspace reload retained same artist and saved kit bio in read-only mode. No payment record, transaction or external messages created. Synthetic profile remains hidden, FREE; prior inquiry retained (not reread during this specific transition).

Found real expiry drift: selected17Oct2026, saved and reopened editor displayed18Oct2026, because local23:59:59 becomes next UTC day and editor used ISO.slice(0,10). Admin patch47434540d872e7e2f15c68de4e74988575798d49 formats stored instants using the same local calendar as input; unchanged selected date preserves exact previous timestamp, preventing extension when editing other fields. Four tests pass in Argentina and Tokyo (8 executions) and inline Admin syntax passes. Added timezone tests to CI. New expiry patch live browser round-trip pending; no production deployment. Does not change bank-derived expiry timestamps or historical records automatically.

## Admin expiry live browser round-trip PASS

Reloaded Admin staging, temporarily enabled PRO on the same hidden synthetic artist with selected date2026-10-17. Saved, reopened: input remained2026-10-17 (previous defect showed18). Saved again without modifying fields and reopened: still2026-10-17; Admin list also showed until17Oct2026. Screenshot captured input. Restored original FREE and cleared expiry, saved and verified list Gratis/Oculto. No payment or publication. Confirms calendar-day stability across two real saves; precise unchanged timestamp preservation is covered separately by unit tests, not by reading hidden browser state. Production unchanged.

## Basic profile accessible labels

Frontend commitd0281efb52adab428939adb9867ce1032923984f gives12 existing basic profile fields explicit stable ids and corresponding label for attributes: artistic name, specialty, city, photo, optional YouTube, Twitch, Kick, fee, availability, support URL, web and bio. Field names, values, submission payloads and FREE/PRO permissions unchanged. Specialty remains editable text with suggestions and YouTube optional. This improves keyboard/assistive identification, not a certification of physical TV/mobile UX.

Two new label contracts plus8 management and9 PRO plan tests pass (19 total); inline syntax passes. CI includes contracts. First staging read still served prior HTML during Pages propagation; visual accessible-name verification pending. No Worker or production changes, no new user records.

## Accessible field labels live confirmation

Reloaded staging management and opened Perfil. Actual browser accessibility tree now names all12 controls (previously unnamed), including artistic name, specialty combobox, city, optional YouTube, biography; stable ids artist-* match labels. Private saved biography remained unchanged, no submission/write made. Completes live accessible-name verification for this patch, not full screen-reader or physical-device certification.
