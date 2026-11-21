# Live demo acceptance: Cartelera — 2026-10-19

Staging only, desktop Chrome. No production, payments or featured activations.

## Completed visible UI flow
- Public Cartelera displays generic hero and named accessible filters/arrows.
- Public event form submitted DEMO QA · Evento ficticio 19-10-2026, labeled explicitly fictitious/not a real show. Date 2026-12-01, function 20:30, venue Espacio ficticio de pruebas, city Rosario · PRUEBA, province Santa Fe, free entry. No featured request, purchase link, price or payment.
- Form returned moderation reference MOD-dbe3eeb5-0b83-4568-aadd-584a7e6bacc3 and retained the completed form with submission locked.
- Existing securely authenticated Admin session restored after navigation. Inspected exact moderation payload before approving this synthetic event only. Admin showed Publicado.
- Public Cartelera showed 1 evento and event EV-MVF91D41. Generic hero remained because no featured event exists.
- Opened event from its public card. Detail preserved title, fiction notice, full description, location, organizer, 2026-12-01 20:30 under Fechas y funciones, and Entrada gratuita.
- Returned through Cartelera link. Filter Con costo + Filtrar returned 0 eventos; Gratis + Filtrar returned 1 evento.

The synthetic event remains in staging as an identified demo fixture. Not certification of physical mobile/tablet/TV, paid highlights, email/Push, actual ticket sales or broader catalog imports. First-paint latency was not measured, though source now includes the generic hero before API completion.

## Demo checkpoint
Two live desktop circuits now have current end-to-end evidence: Cartelera and Bolsa de Trabajo (see DEMO-JOBS-LIVE-ACCEPTANCE-20261019.md). Remaining gates: actual video elapsed playback, authenticated artist/Press Kit revalidation, authorized operator session/Radio Studio, Radio/TV current candidate and physical target devices. Payments remain last and disabled for the demo.
