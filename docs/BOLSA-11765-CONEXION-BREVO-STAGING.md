# Worker11765 · conexión privada con Brevo · solo staging

26/10/2026. **Código preparado; despliegue y aceptación de Brevo pendientes.** El usuario confirmó «guardada en staging» para el secreto `BREVO_API_KEY`. Work no vio su valor ni leyó el binding autenticado. Capturas anteriores muestran remitente verificado, DKIM/DMARC correctos y plan Free con300/300 disponibles. Evidencia: `evidence/correo-brevo-remitente-y-secreto-20261026.json`.

## Para el operador

1. Descargar `releases/uadav-api-staging-11765.zip` de esta rama y extraerlo. También está disponible el `worker.js` de esta rama. No usar los archivos del laboratorio o de restauración.
2. En Cloudflare, abrir **Workers & Pages → uadav-api-staging → Edit code**. Reemplazar el módulo por el `worker.js` entregado y desplegar exclusivamente ese Worker. Conservar bindings, secretos y el cron existente. **No hay SQL nuevo, base nueva, flags nuevos ni otro secreto para este paso.** No cambiar producción, Pages, el laboratorio o restore QA.
3. Abrir [la prueba de correo](https://uadav-api-staging.uadavstream.workers.dev/qa/correo). Ingresar la **clave Admin del Centro de Control de staging que ya tiene el operador**, en su propio navegador. No ingresar allí la clave API de Brevo ni enviarla al chat.
4. Pulsar **Verificar conexión con Brevo** una sola vez. Después pulsar **Copiar resultado seguro** y compartir ese resultado. Si la respuesta tarda demasiado, usar **Consultar resultado**; esa consulta no repite la llamada al proveedor.
5. Un resultado `accepted`, build11765, scope `brevo-sandbox-staging`, con `sandbox:true`, `emails_sent:0`, `delivery_verified:false`, `recovery_enabled:false` confirma aceptación de una solicitud en modo de prueba. **No confirma entrega real, recuperación, login o cuenta verificada.** No retirar503 ni activar correo por ese resultado.

Si se ve404 o una versión anterior, el código nuevo todavía no se está sirviendo. `BREVO_KEY_MISSING` indica que el Worker no detecta un secreto válido con ese nombre; comprobarlo en el Worker indicado, sin mostrar su valor. `MAIL_CONFIGURATION` abarca rechazo401/403 del proveedor: revisar vigencia/permisos o avisos de seguridad en Brevo, sin generar claves repetidamente ni publicarlas. `BREVO_STORAGE` requiere revisar el estado D1 existente; no reinstalar ni aplicar SQL a ciegas. Si queda `pending`, consultar; `interrupted:true` señala que terminó el plazo local sin confirmación persistida y no autoriza un reenvío automático.

La prueba queda limitada a **cinco solicitudes distintas por día argentino**. Las consultas y repeticiones con el mismo identificador no consumen otra llamada. El cupo no se aumenta cambiando flags; esperar al día siguiente si se agotó. Cerrar con **Salir** al terminar.

## Alcance del código

La página `/qa/correo` y la API `/api/admin/jobs/email-check` están restringidas al hostname HTTPS exacto de `uadav-api-staging`. La API exige la clave Admin existente antes de tocar D1 o el secreto del proveedor; solo admite mismo origen o clientes sin cabecera Origin. La página es pública pero no contiene información del entorno, claves o datos de usuarios. CSP con nonce, sin recursos externos, no-store y sin almacenamiento persistente de la clave Admin; el campo se limpia al entrar y la sesión se descarta al salir/cerrar la página. Se exige reingreso después de10minutos.

El servidor fija remitente de staging, destinatario reservado `uadav-sandbox@example.invalid`, texto y `headers.X-Sib-Sandbox: drop`. No acepta un destinatario, URL, mensaje, token o cabeceras suministrados por el navegador. El modo sandbox documentado por Brevo valida la solicitud sin entregar un correo. La pantalla deja esa diferencia explícita.

`scripts/brevo-request.mjs` reúne el cliente HTTPS acotado compartido con el transporte preparatorio: endpoint fijo, sin redirecciones, límite de5segundos incluyendo cuerpo, JSON/UTF-8 de hasta8KiB y aceptación solo con201 y un `messageId` válido. Se guarda únicamente su hash; no se devuelve el recibo, la clave o la respuesta cruda del proveedor. No hay reintento automático.

La reserva atómica y el resultado se guardan en las tablas existentes `job_store_meta`/`job_store_checks`, con sesión `first-primary`. Claves de prueba `brevo:sandbox:daily` y `brevo:sandbox:request:<UUID>`, nonce de propietario y máximo5/día. Se limpian solo registros de esta prueba de más de7días cuando se inicia una nueva. Una respuesta perdida al reservar no inicia otro contacto; una respuesta perdida al confirmar se consulta por su identificador. Fallos SQL, replays y límites no cambian ofertas, postulaciones, credenciales, vínculos, avisos o recibos del cron.

El núcleo de outbox, el transporte de mensajes reales y los mensajes de acceso **siguen sin integrarse**. Las rutas públicas de recuperación conservan503 incondicional aunque exista `BREVO_API_KEY`. No se aplica la migración de outbox, no se programa correo y no se modifica el cron ni la QA de vencimiento real del27/10 a las00:00 de Argentina. El campo histórico `email_automation` del health corresponde a otro webhook; no debe interpretarse como estado de este secreto.

## Pruebas y límites de la evidencia

**146 pruebas focalizadas Node/SQLite aprobadas**, incluidas24 nuevas de la conexión/pantalla, y **21 comprobaciones workerd aprobadas**, motor1.20261025.1. También aprobaron las12 de Radio, política pública, compatibilidad KV, sintaxis y cotejo de fuentes embebidas. Se prueban concurrencia, duplicados, cupo atómico, propiedad, fallos antes/después del commit, respuestas perdidas, errores saneados, configuración/CORS/host, recuperación503 y seis grupos de interacción de pantalla con DOM simulado.

Todas las llamadas del proveedor en esas pruebas son simuladas; SQLite es local. No prueban la clave real, D1 remoto, recepción de correo, clientes de email o dispositivos físicos. **La revisión visual no pudo completarse:** el navegador local salió antes de cargar la página, último intento conSIGTRAP; no se produjeron capturas ni se aprobaron los tamaños previstos1280/390/320. No se atribuye ese cierre a la aplicación. Registro: `evidence/brevo-11765-local-ui-20261026.json`. Las seis pruebas DOM no prueban el aspecto visual; comprobarlo en el navegador del operador después del despliegue. Los tests generales de toda la plataforma conservan fallos previos ajenos a este cambio; no se declara toda la plataforma aprobada.

Worker11765:663849bytes; SHA256 `486171b739a8c0dd196f8f7320c2bfa530c296b11bde4b9a3854036f1039daf3`. ZIP11765:163844bytes; SHA256 `d55b16725e8a1d049ac8ae930c12b074a58caf8fe19ffe1b6b55b900a45f860c`; se abrió/cotejó el Worker interno y no tiene credenciales. ZIP11764 y archivos del laboratorio/restauración permanecen idénticos. Pages `7e16b2a815a218df870d7375ae565af6893afa70` y main `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd` se cotejaron sin cambios. No hay despliegue desde Work. El commit y resultados CI se registran después de persistir el código; eso tampoco acredita despliegue.

## Después de esta prueba

La aceptación sandbox solo cierra la comprobación inicial de conexión. Falta autorizar un destinatario real, probar recepción, resolver la aceptación incierta/idempotencia del outbox y persistir el mensaje completo, integrar cuenta/email/UI y canje, backup/retención/rotación y QA D1 remoto. No se repite el laboratorio11764 aprobado, que no contiene este código. Bolsa mantiene sus cinco bloques de cierre abiertos y Cartelera sigue después de su validación completa.

Referencias oficiales consultadas: [sandbox de Brevo](https://developers.brevo.com/docs/using-sandbox-mode), [API de envío](https://developers.brevo.com/reference/send-transac-email), [permisos de claves API](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys) y [secretos de Cloudflare](https://developers.cloudflare.com/workers/configuration/secrets/).
