# Demo UX: simple, readable and modern — 2026-10-19

## User direction
Prioritize a usable demo before the final release. Simplify repetition, menus and labels; use icons only when they help understanding. Aim for children, adults and older people to understand the interface. A more extensive visual redesign can follow. Payments are the last phase: bank account details will be supplied by the user, configured through Admin, then the payment circuit tested.

Production means the public live site. Current work remains in isolated staging/audit branch; these changes do not publish production.

## Implemented
- Moderation event and job cards use Evento · title / Oportunidad · title instead of raw API paths. Pendientes uses the same readable titles, so name search finds them.
- Event/job review shows place, date, function times, organizer/publisher, category/discipline, description, contact and event admission type directly. A requested highlight explicitly does not imply payment confirmation. Technical payload remains under its existing disclosure.
- Automatic moderation settings now sit under Configurar revisión automática, closed initially, with a short visible status. No moderation setting was changed.
- Bolsa has one main h1, a shorter Oportunidades disponibles section, aligned private tracking panel, a named close control and visible keyboard focus.
- Event form labels increased from 9px to 12px; informative note text increased to 14px; keyboard focus made visible.

## Validation
19 Admin review tests, 22 jobs UI/contract tests and 13 event publication UI tests passed (54 total). New review tests cover human titles across both inboxes, direct field summaries, no false payment implication and safe text rendering of markup. Existing review in-flight guards, artist access separation and late-response protection still pass. Syntax passed.

New deployment/visual verification is pending for this UX pass. Current live Cartelera/Jobs/Radio acceptance remains documented separately; no synthetic records or permissions were changed in this UX pass.

## Next screens
Apply the same hierarchy to remaining navigation and private artist/operator journeys: one clear page title, one primary action per task, plain language, labels alongside meaningful icons, readable text and visible focus. Do not remove capabilities merely to reduce element count or call a physical device compatible without testing.
