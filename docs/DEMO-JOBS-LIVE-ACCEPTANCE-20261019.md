# Live demo acceptance: Bolsa de Trabajo — 2026-10-19

Environment: isolated uadav-stream-staging Pages and staging API. Production, payments, real personal data and operator permissions unchanged.

## Completed in Chrome through visible UI
1. Opened Trabajo → Bolsa de trabajo without a user account.
2. Submitted DEMO QA · Convocatoria ficticia 19-10-2026. Description explicitly says not a real job, no actual hiring/remuneration; contact uses example.invalid; city Rosario · PRUEBA; date 2026-12-01.
3. Public response confirmed manual moderation. It did not claim publication and the item was absent from public list.
4. Secure Admin login completed; dashboard visibly authenticated. Pending moderation item MOD-fc01bfba-71c0-4896-9002-c4afb8fb8f7b matched the exact submitted text in its details. Approved only this synthetic job. Admin showed Publicado.
5. Refreshed public jobs through Buscar; the synthetic opportunity appeared with Postularme.
6. Submitted one synthetic application, name Postulante QA DEMO · Ficticio, email under example.invalid, no WhatsApp or real portfolio. Confirmed receipt visible. No private key was read, copied, logged or placed in a URL.
7. Used the receipt's built-in tracking button. The private state query returned Estado: pendiente.
8. Admin → Bolsa de Trabajo showed Oportunidades 1 / Postulaciones 1. The application row matched the synthetic applicant and job JOB-MVF8XT4Q, dated 19 oct 2026, state pendiente.

The synthetic opportunity and application remain in staging as identified demo fixtures. No production records created. This is desktop Chrome evidence, not physical mobile/tablet/Smart TV acceptance.

## Fix derived from the live test
The public submission confirmation omitted the moderation reference. Updated frontend now shows the confirmed moderation_id or published item id and rejects malformed moderation receipts before clearing the draft. 22 job UI/contract tests and the Worker+SQLite/KV job integration passed. Source commits 8d3bf3209c1817bebbbfde3866a3f3572331acb2 and 4bdb42e05c4f98be0f1bcaf0177e44c1932b0487. This new confirmation UI was not used to create the original job; deployment must be checked separately.

## Other live evidence
Cartelera now visibly exposes the generic slider, accessible named filters/arrows and numbered dot after the successful Pages deployment of commit 58f74d19e690cab2a32131e092bf76917e484653. First-paint timing itself was not measured.

Event DEMO QA · Evento ficticio 19-10-2026 was then submitted through the public event form, free entry, no featured request, date 2026-12-01 at 20:30, fictitious venue/city and own staging fallback image. It was received for moderation with reference MOD-dbe3eeb5-0b83-4568-aadd-584a7e6bacc3. Approval/public detail verification remain pending at this checkpoint.
