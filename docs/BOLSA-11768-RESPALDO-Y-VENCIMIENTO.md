# Bolsa11768 · respaldo y vencimiento · solo staging

Preparación27/10/2026. El operador informó la recuperación real11767 `complete`: correo recibido, enlace confirmado, clave anterior revocada, acceso privado nuevo y oferta ficticia conservada sin publicación. El reporte no incluye hora de ejecución. Se cotejaron versión, flags y etiquetas con el código; Work no leyó el estado autenticado ni comparó los bytes del Worker remoto. Evidencia: `evidence/bolsa-11767-recuperacion-real-aprobada-20261027.json`. No repetir ese correo, los laboratorios aprobados o la configuración de Brevo/Pages.

11768 corrige un respaldo que podía mezclar registros y credenciales leídos en momentos diferentes. Añade una consulta privada del vencimiento real ya preparado y limpieza acotada de datos temporales en el cron existente. Código preparado y probado se distingue del despliegue manual y de sus resultados reales; estos últimos siguen pendientes para11768.

## Única intervención del operador

1. Descargar `releases/uadav-api-staging-11768.zip` y extraer **worker.js**.
2. Cloudflare → **Workers & Pages → uadav-api-staging → Edit code → Deploy**: reemplazar el código por ese archivo. Conservar DB/KV, Admin, `BREVO_API_KEY`, `BREVO_QA_RECIPIENT`, `JOB_RECOVERY_ENCRYPTION_KEY`, cron `*/15 * * * *` y `JOB_STAGING_CRON=bolsa-only`. No crear secretos, bases, Worker, cron o SQL nuevos. No modificar producción, Pages o laboratorios.
3. Abrir [Respaldo y vencimiento](https://uadav-api-staging.uadavstream.workers.dev/qa/bolsa-cierre). Entrar con la **clave Admin staging existente**. La consulta usa GET, no publica, postula, cambia fechas, envía correos o ejecuta restauraciones.
4. Pulsar **Descargar respaldo privado**, guardar el JSON en un lugar privado y marcar la confirmación de guardado. La página comprueba el checksum y la captura D1 antes de solicitar la descarga; el navegador no acredita por sí solo que el archivo quedó guardado.
5. Después del próximo turno del cron de15min, pulsar **Consultar de nuevo**. Para acreditar dos turnos deben cambiar sus marcas de ejecución y conservar exactamente un aviso. Si la sesión Admin de10min vence, volver a entrar en la misma pestaña: solo la comparación y los metadatos seguros permanecen en memoria. Salir, cerrar/recargar la pestaña los borra.
6. Pulsar **Copiar resultado seguro** y compartir únicamente ese JSON. Un `pending` requiere revisar qué comprobación falta; no repetir envíos, modificar la QA o activar variables para forzar un `complete`.

Nunca compartir el respaldo completo, claves, correo, enlaces con token o datos de postulantes en chat/GitHub. El respaldo contiene datos privados y hashes permanentes necesarios para recuperar accesos.

## Qué acredita la pantalla

La QA existente mantiene fecha26/10; su vencimiento fue27/10 a00:00Argentina (=03:00UTC). Se consulta la oferta `JOB-MVPJ9WRW-439D4126D9AE` y la candidatura `POST-MVPJCNGX-E7683EC0` sin modificarlas. El resultado seguro no incluye esos identificadores o datos personales.

Comprueba fecha intacta/alcanzada, exclusión por la política pública, estado vencido almacenado, candidatura con consentimiento conservada, un registro y mensaje privado de vencimiento para la cuenta vinculada, y último cron exitoso posterior al vencimiento. Un error de cron posterior no queda oculto por un éxito anterior. La comparación en el navegador acredita dos marcas distintas con un aviso; no cubre todas las ejecuciones históricas.

También consulta que exista el registro de QA11767 completada, unido a un canje consumido y a la credencial nueva vigente. No envía otro correo o cambia credenciales. Después de la retención de registros temporales esa evidencia viva puede desaparecer; el reporte histórico aprobado se conserva por separado.

`result:complete` de scope `bolsa-backup-expiry-staging` cubre este diagnóstico y el respaldo guardado según confirmación del operador. **No declara Bolsa terminada.** No realiza una postulación nueva por HTTP: `live_new_application_probe_performed:false`. La prueba negra de rechazo de una postulación vencida, dispositivos físicos, recuperación pública e integral siguen siendo verificaciones distintas.

## Respaldo y restauración

- Las tablas D1 presentes de la lista permitida se leen en un lote transaccional, con inventario cotejado dentro del mismo lote. Ofertas/postulaciones se proyectan desde esa misma captura y la autoridad de credenciales vigente. Un cambio de esquema, lectura fallida, migración incompleta o JSON inválido impide declarar el respaldo completo.
- La consistencia atómica se refiere a D1. Las otras claves KV se capturan separadamente; no hay transacción distribuida KV+D1. No se consulta la copia KV antigua de Bolsa como autoridad.
- Se excluyen desafíos/tokens de recuperación, outbox cifrado, QA de correo, contadores, comprobantes temporales y pairings, así como metadatos `brevo:`, `mail:` y el lease del cron. Los hashes permanentes, registros, vínculos y marcas de avisos se conservan. No se borran datos vivos al exportar.
- `backup_digest` SHA256 detecta cambios/corrupción estructural; **no es firma ni prueba de autenticidad del emisor**. El informe distingue `content_sha256` del JSON estructural y `file_sha256` del archivo descargado. Guardar el archivo y su hash juntos no sustituye protegerlos.
- `scripts/rehearse-job-restore.mjs` verifica el checksum nuevo antes del ensayo local. Los respaldos antiguos sin ese campo siguen identificados como `legacy_backup_without_checksum:true`, sin atribuirles una comprobación inexistente.
- En el restore faltante existente, y solo para ofertas realmente recuperadas, la misma transacción cancela intenciones de correo y consume pruebas antiguas que ya estuvieran en destino. Si algo falla, también se revierte esa invalidación. No modifica credenciales de ofertas ajenas/existentes ni restaura sesiones temporales desde el respaldo.
- **Restore operativo continúa apagado.** No activar `ENABLE_JOB_D1_RESTORE` o `ENABLE_JOB_KV_RESTORE`. Las pruebas de esta revisión usan SQLite sintético con flags locales; no ejecutan restauración remota del respaldo privado real ni recuperación de toda la plataforma.

## Retención dentro del cron existente

Sin crear otro trigger, cada turno existente puede expirar hasta25 intenciones vencidas, vaciando cifrado/lease; retirar hasta25 intenciones terminales con vencimiento anterior a7días; y retirar hasta25 metadatos `brevo:` con fecha entera de creación anterior a7días. El esquema de correo debe tener el marcador11767 reconocido; uno ajeno falla de forma segura. La limpieza se ejecuta en un lote atómico y sus contadores se guardan en el resumen del cron. No altera ofertas, candidaturas, claves permanentes, vínculos, avisos o el marcador de esquema. No envía mensajes.

Esta retención acotada de intenciones y metadatos no equivale a una política completa de eliminación, rotación de claves o recuperación de cuentas. La recuperación pública y el restore operativo siguen deshabilitados.

## Verificación y continuidad

Pruebas finales, huellas del paquete y CI se registran en `evidence/bolsa-11768-verificacion-local-20261027.json` y en el checkpoint de `CONTINUIDAD-WORK-20261024.md`. El estado de los cinco bloques restantes está en `BOLSA-ESTADO-Y-CIERRE-20261025.md`. Mantener separados código escrito, pruebas sintéticas, reporte del operador y despliegue observado.

Pruebas locales finales: **252Node,27controles workerd1.20261025.1 y12Radio aprobados**; política pública, compatibilidad KV, sintaxis, fuentes y ZIP aprobados. Los50artefactos anteriores conservan sus bytes. Worker786785bytes SHA256 `3f1ab89bbc837fa18c6d56b4d25e09fdd068f2dc6ee28c7b8bd13544b5c64c78`; ZIP194878bytes SHA256 `ce19e6ae859dd4262746f779fff297444c623f9f0ba85a334f78a70a2a6f622a`. No equivalen a despliegue, correo real nuevo, SQL remoto, restauración integral o cobertura física.

## GitHub y CI confirmadas

Código/ZIP en commit `c782c2541d93f728eba8f4cbc82a519c98511c59`, árbol `ca680e246fbd22626b323e95e1f4f5f1d99c5a26`,23blobs cotejados con el índice local. [CI Bolsa40451323481](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40451323481) y [CI Radio40451323476](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40451323476): `completed/success` para ese commit. Pasos de pruebas y verificaciones aprobados; cifras exactas252/27/12 obtenidas de los logs locales de los mismos comandos, sin descargar otro archivo de logs numéricos CI.

Rama Pages y producción cotejadas sin cambios. La persistencia y CI no despliegan el Worker principal. Falta la intervención manual de esta guía y su resultado seguro.
