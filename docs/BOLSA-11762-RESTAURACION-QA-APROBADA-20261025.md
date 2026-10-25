# Bolsa 11762 · restauración D1 aislada aprobada · 25/10/2026

## Resultado real

El usuario confirmó la corrección del Secret y el acceso se completó mediante browserAuth, sin leer, registrar ni publicar su valor. La interfaz de **https://uadav-restore-qa.uadavstream.workers.dev/** confirmó que la base vinculada estaba vacía. Se preparó su esquema y se ejecutaron las seis fases mediante sus controles visibles.

| Comprobación en D1 de Cloudflare | Resultado observado |
|---|---|
| Restauración bloqueada por defecto | Aprobada; sin escrituras del lote bloqueado. |
| Recuperación de oferta, postulación, acceso, vínculos y marca de aviso | Aprobada. |
| Repetición de la misma recuperación | Aprobada; sin duplicados. |
| Fallo SQL deliberado en el segundo lote | Aprobado; rollback de todas sus escrituras. |
| Reintento posterior al fallo | Aprobado. |
| Cotejo de campos, accesos, consentimiento, referencias e integridad | Aprobado. |

La pantalla mostró **Ensayo completo** y habilitó **Copiar resultado sin datos privados**. Las fases ejecutadas exigieron los conteos finales **2 ofertas, 2 postulaciones, 2 credenciales, 4 vínculos y 2 marcas de aviso**, todos ficticios. Se conservaron los registros en el recurso desechable; no se borraron tablas ni se intentó reiniciar la prueba.

[Captura de los seis resultados](evidence/bolsa-restore-qa-aprobada-20261025.jpg). [Registro de observación y aserciones](evidence/bolsa-restore-qa-11762-resultado-20261025.json).

## Código y comprobación posterior

Health QA: `11762-restore-qa-1`, `enabled:true`, `database_bound:true`, núcleo SHA256 `94e6603f4f9d44f6cfaa6f152c4670f27335ef9fdd7c52e90c3985b4ecdaab98`. Adaptador guardado en `37e1cfbd9c10c7a8800d4a38b0b4b3ada0623f64`; CI Bolsa **40238857214** y Radio **40238857246** ya aprobadas. No hizo falta modificar código de ejecución para este ensayo.

El Worker principal respondió el `2026-10-25T23:13:21.154Z` (**20:13 de Argentina**): build **11762**, D1/KV disponibles, `email_automation:false`, `queue:false`. No se cambiaron sus variables o bindings, no se habilitó su endpoint de restauración y no se operó sobre producción. El adaptador llamó dentro de su isolate al handler incluido, con la D1 de QA: no hizo una llamada HTTP de restauración a staging.

## Alcance y límites

- Acredita el handler de restauración y las transacciones D1 con fixtures, sus credenciales separadas, vínculos y ledger. La identidad del nombre de la base en el dashboard no se inspeccionó; sí se comprobó la base vacía desde el binding y se ejecutó el esquema y la prueba en él.
- El respaldo privado real versión 4 (12 ofertas, 10 postulaciones) conserva su ensayo local aprobado. **No se subió al Worker QA ni se restauró íntegramente en D1 remoto.** La recuperación integral de cuentas y mensajes de toda la plataforma tampoco forma parte de esta prueba.
- El botón de copia mostró éxito. La lectura del portapapeles de control devolvió texto vacío, por lo que no se acredita una comparación de su JSON pegado. El registro adjunto declara ese límite y procede de la interfaz y las aserciones del handler; no simula una descarga.
- No habilita recuperación por correo, cron o restauración sobre la base operativa. Los endpoints de recuperación por correo siguen deshabilitados.

## Próximo bloque de Bolsa

Vencimientos y avisos posteriores al vencimiento real, con ejecución programada acotada a Bolsa. La revisión del código detectó que `uadavWorker.scheduled` ejecuta mantenimiento general, Bolsa, push y podcasts juntos. No corresponde activar ese cron compartido para acreditar solo Bolsa: primero debe prepararse su alcance y probarse, sin cambiar producción. También permanecen pendientes la entrega transaccional de correo, la segunda cuenta independiente/perfil artístico y los dispositivos faltantes. Ver `BOLSA-ESTADO-Y-CIERRE-20261025.md`.
