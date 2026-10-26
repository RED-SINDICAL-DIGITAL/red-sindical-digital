# Bolsa 11763 · oferta, candidatura y aviso previo automático confirmados · 26/10/2026

## Resultado

El usuario informó **PUBLICADA**. Se recargó Bolsa staging: seis oportunidades públicas, las cinco anteriores y una única coincidencia del nuevo título al filtrar. El respaldo D1 permitió comprobar la fecha límite y las relaciones sin consultar ni publicar claves o datos de contacto.

- Oferta: **`JOB-MVPJ9WRW-439D4126D9AE`**, **QA 11763 · Vencimiento real · NO CONTRATAR**, activa, fecha y fecha límite **2026-10-26**. El campo Fecha por sí solo no determina el vencimiento; aquí se comprobaron ambos campos.
- Candidatura: **`POST-MVPJCNGX-E7683EC0`**, asociada a esa oferta, estado **recibida**, consentimiento `job_application_v1` registrado a las `2026-10-26T17:33:39.921Z` (**14:33 Argentina**).
- Oferta y candidatura guardadas voluntariamente en la misma cuenta existente. Esa cuenta es distinta de las usadas en los vínculos QA anteriores; no se creó una cuenta o vinculó un dispositivo desde Work. Esto no acredita por sí solo la prueba de rechazo entre cuentas ni el vínculo con un perfil artístico.
- Los 22 registros previos, sus credenciales, vínculos y marcas de aviso permanecieron iguales al cotejarlos con el respaldo anterior. La nueva candidatura y la oferta también permanecieron idénticas entre las exportaciones anteriores y posteriores al aviso.

Antes del turno de las 14:45, la revisión Admin de solo lectura mostró una oferta **Por vencer**, fecha límite 2026-10-26, pendiente de aviso. No se confirmó ni pulsó el envío manual.

## Aviso generado por el cron

El evento real empezó a las `2026-10-26T17:45:39.986Z` y terminó a las `2026-10-26T17:45:41.581Z`, **14:45 de Argentina**. El recibo D1 declara **success**, `processed:0`, `emitted:1`, `recorded:1`. Admin lo mostró como una revisión exitosa con un aviso privado.

El respaldo posterior confirma **una marca soon y un mensaje privado**, ambos para la cuenta que guardó esta oferta, con fecha límite 2026-10-26. Título: **Una de tus ofertas está por vencer**. El mensaje invita a abrir Mis trabajos para revisarla, cerrarla o renovarla. El aviso se creó a las `2026-10-26T17:45:40.988Z`. La revisión GET posterior mostró **No hay avisos pendientes para las cuentas vinculadas**.

Esto comprueba generación automática y destinatario guardado. **Visualización en PC aprobada posteriormente**: el usuario confirmó aviso visible y aportó una captura inspeccionada con el aviso de vencimiento y el de postulación. Son dos hechos distintos. Ver BOLSA-11763-AVISO-VISIBLE-20261026.md. Mi Perfil de Work continúa sin vincular; la evidencia visual procede del dispositivo del usuario. No se pidió un TXT con claves, no se extrajeron credenciales ni se aprobó una nueva vinculación. El turno real siguiente, de las **15:00 de Argentina**, también terminó con éxito y **cero ofertas actualizadas/cero avisos emitidos**. Se observó su recibo mediante GET a las `2026-10-26T18:01:24.939Z`; el aviso previo no se volvió a emitir. Esa hora de turno tiene la resolución de minuto de Admin, mientras que los tiempos exactos del primer aviso proceden del respaldo de las 14:47.

[Evidencia del recibo y revisión sin pendientes](evidence/bolsa-11763-aviso-automatico-20261026.jpg). [Registro seguro y límites](evidence/bolsa-11763-vencimiento-real-20261026.json).

## Respaldo privado actualizado

Se reemplazó el mismo archivo privado, conservando su identidad e historial, como **versión 5**: **13 ofertas, 11 postulaciones, 24 registros, 7 credenciales, 5 vínculos y 2 marcas de aviso**. Tamaño **268315 bytes**, generado `2026-10-26T17:47:23.903Z`, SHA256 `2865eefe5a91145ab459743580e51ec760b4c117c95abe3396988966974a9442`. El respaldo completo no se publicó en GitHub; este informe solo contiene identificadores de QA y comprobaciones sin información personal.

Verificador existente de respaldo: aprobado. Ensayo con el handler real y red bloqueada en SQLite en memoria: **seis lotes**, colecciones, credenciales, vínculos y ledger cotejados, repetición sin duplicados, fallo con rollback y reintento, integridad correcta y recuperación por correo en 503. **No equivale a restaurar remotamente este respaldo privado completo**, ni a recuperación integral de cuentas o de toda la plataforma. El adaptador remoto 11762 de datos ficticios mantiene su aprobación previa.

La pantalla de respaldo 11763.2 también se comprobó ahora tras una descarga D1 real: título correcto, 13/11 registros y controles SQL/migración ocultos. No hubo nuevo código de ejecución o despliegue en esta sesión. Las suites anteriores conservan su resultado; no se repitieron por cambios documentales.

## Próximo punto de control

Mantener la oferta con su fecha actual hasta que venza naturalmente. La prueba de vencimiento comienza el **27/10/2026 a las 00:00 de Argentina**, `2026-10-27T03:00:00Z`. Falta comprobar retirada del listado, rechazo del servidor a nuevas postulaciones, candidatura preservada, cierre programado y un único aviso posterior, con repetición sin duplicados. No adelantar reloj, cambiar fechas previas o cerrar la oferta para simularlo. Ver `BOLSA-11763-QA-VENCIMIENTO-REAL.md`.

Bolsa sigue abierta por ese ensayo y las otras puertas de `BOLSA-ESTADO-Y-CIERRE-20261025.md`. Producción, recuperación por correo, cola, restore operativo y Worker de restauración QA no se modificaron.
