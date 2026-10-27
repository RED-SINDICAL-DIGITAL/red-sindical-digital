# Correo de acceso y Brevo · preparación aislada · 26/10/2026

Decisión funcional en `CUENTA-UNICA-Y-ACCESO-SIMPLE-20261026.md`: cuenta única, correo privado y Google opcional para evitar administrar códigos largos. Dominio **Autentificado**, remitente **Verificado**, DKIM/DMARC y Free300/300 por capturas. `BREVO_API_KEY` guardada según usuario, sin ver valor/binding. Actualización27/10UTC: **11765 sandbox accepted informado por operador**, cero correos y recuperación apagada; evidencia `evidence/brevo-11765-sandbox-aprobado-20261027.json`. Entrega/canje/login siguen sin comprobarse.11766 prepara solo un correo diagnóstico a su dirección propia con comprobación de recepción; guía `BOLSA-11766-RECEPCION-BREVO-STAGING.md`.

## Dominio autenticado por el operador

Capturas del26/10,19:56 Argentina: Cloudflare muestra los dos CNAME DKIM y dos TXT de correo-staging, todos DNS only/Auto; Brevo muestra `correo-staging.uadavstream.com.ar` Autentificado, Sin marca. La personalización de enlaces era opcional y se dejó vacía. Evidencia segura en `evidence/correo-brevo-dominio-autenticado-20261026.json`; originales privados, sin copiarlos al repositorio. Work inspeccionó las imágenes, no una sesión autenticada ni los valores DNS completos, que aparecen truncados. No hubo cambios DNS desde Work ni comparación integral de la zona productiva.

Avance posterior por capturas: remitente **UADAV STREAM · pruebas**, **acceso@correo-staging.uadavstream.com.ar**, verificado; DKIM y DMARC verdes. Plan Free,300correos restantes de300. Se guio una clave de acceso restringido con permisos solo para email transaccional; «guardada en staging» confirma la acción del operador, no la lectura autenticada de sus permisos o binding. Evidencia: `evidence/correo-brevo-remitente-y-secreto-20261026.json`. No repetir dominio, remitente, cupo o creación de clave. Siguiente paso: desplegar11765 y comprobar la conexión privada sandbox según `BOLSA-11765-CONEXION-BREVO-STAGING.md`; no requiere destinatario real ni SQL. Recuperación y nuevo login continúan apagados.

## Código escrito, sin despliegue

- `scripts/access-mail-message.mjs`: tres mensajes de acceso, verificación de correo y recuperación de oferta. Una acción principal, HTML/texto, hora argentina 24h y botón de al menos 48 px; sin imágenes ni recursos externos. Token aleatorio opaco en fragmento del enlace; nunca claves permanentes de cuenta/Admin. Datos de emisión/vencimiento fijos para que el texto no cambie al reintentar.
- `scripts/brevo-staging-mail.mjs`: transporte HTTPS fijo a `api.brevo.com/v3/smtp/email`, sin redirecciones ni credenciales del navegador. Emisor acotado a `correo-staging.uadavstream.com.ar`, modo explícito y lista de 1–10 destinatarios para QA. El modo declarativo no verifica propiedad del dominio ni consentimiento real: su configuración futura debe hacerlo.
- Cuerpo construido por el servidor: un destinatario, sin CC/BCC, adjuntos, importación de contactos, cabeceras arbitrarias o acceso a Gmail. Clave API solo en header del proveedor. El transporte no contiene una clave real ni ejecuta llamadas al importarse.
- UUID de la intención como `headers.idempotencyKey`; mismo cuerpo y plazos al repetir con igual configuración. Respuesta JSON/UTF-8 acotada a 8 KiB y tiempo máximo de 5 segundos, incluyendo lectura del cuerpo. Cancelación, redirección, cuota, rate limit, error de configuración, respuesta inválida y recibo faltante fallan con códigos seguros.
- Solo HTTP201 y un `messageId` válido producen aceptación. Su SHA256 se normaliza como identificador interno `brevo:<hash>`; no se inventa un ID del proveedor. No es constancia de entrega/lectura.
- La adaptación al outbox de Bolsa conserva el UUID, token y vencimiento originales. Para cuentas generales solo se preparó el mensaje/transporte: no existe aún su sistema de emisión/canje, federación Google, endpoint o pantalla receptora.

**Mensajes, transporte real y outbox no están importados ni embebidos en `worker.js`.** Actualización11765: el cliente HTTPS común se extrajo a `scripts/brevo-request.mjs` y se embebió únicamente para la prueba privada con destinatario `.invalid` y sandbox obligatorio. Código preparado, despliegue pendiente. El secreto fue guardado según el operador; todavía no se comprobó mediante API. No hay envío real o SQL remoto de outbox. `/acceso-correo.html` es un destino reservado todavía no implementado. No usar esos enlaces con personas reales ni aplicar el SQL previo para habilitar el correo.

## Idempotencia: diferencia importante con Resend

La documentación de Brevo consultada el26/10 indica una ventana de deduplicación de **30 minutos** y error `duplicate_parameter` en un reintento, en lugar de prometer el recibo original. No declaramos una hora ni suponemos que ese error proporciona el `messageId` anterior.

El guard del outbox pasa de una hora arbitraria a un mínimo calculado: **15 minutos de vida del token + 30 segundos de lease + 5 segundos de envío = 935.000 ms**. Sigue rechazando antes de DB un proveedor que no cubra ese plazo. Brevo declara su ventana real de30min; no se envía de nuevo una intención vencida ni se extiende su validez para el día siguiente.

Una aceptación201 permite activar el token en el lote D1 ya diseñado. Si el proveedor aceptó pero se perdió su respuesta, el siguiente `duplicate_parameter` queda **sin confirmar**. No produce recibo falso ni un token canjeable, y conserva la credencial/vínculo anterior. Tras los cinco intentos limitados se borra el payload cifrado y no se reenvía esa intención. Está probado como comportamiento de seguridad, **no como recuperación satisfactoria del usuario**.

Antes de habilitar falta resolver esa recepción incierta con evidencia auténtica o un diseño revisado y ensayado. No reemplazarla por tratar cualquier error de duplicado como éxito. También falta proteger la inmutabilidad del mensaje entre despliegues/cambios de remitente: el outbox actual cifra token/destinatario, pero aún no persiste todo el cuerpo renderizado/configuración del proveedor.

## Pruebas y límites

17 grupos del transporte/mensajes y3 nuevos de composición con el outbox, además de los20 previos del outbox, aprobaron localmente. Incluyen: dirección ajena/inyección, permisos del emisor, payload restringido, fecha en medianoche argentina, reintentos idénticos, token vencido, respuesta perdida/duplicado, canje D1 único, preservación del acceso anterior, recibos malformados, respuestas demasiado grandes, errores saneados, timeout/cancelación y ausencia de importación en el Worker operativo.

La red de esos tests es simulada y los datos son ficticios. Los resultados no prueban Brevo real, la página de destino, D1 remoto, recepción de correo ni UX física. Los mensajes tienen estructura accesible básica, pero falta inspección visual de clientes de correo y validación con teclado/lectores/usuarios.

Preparación inicial: **122 pruebas focalizadas Node/SQLite aprobadas** y **20 comprobaciones workerd aprobadas**, sin cambios de Worker11764. Actualización11765: **146 y21**, respectivamente, con el motor fijado1.20261025.1; también las12 de Radio, política pública, compatibilidad KV, sintaxis y fuentes. Worker cambia a11765 exclusivamente por la prueba privada sandbox; ZIP11764 y laboratorio congelado sin cambios. CI incorpora los archivos nuevos. No repetir el laboratorio11764: no contiene este código. La oferta de vencimiento real mantiene su fecha y su cron original.

Código y decisión guardados en `09ac96fad850a8016e2f2bc8fa9d2b7696a93932`, exclusivamente Worker staging. CI [Bolsa40413223664](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40413223664) y [Radio40413223652](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40413223652) confirmadas `success` para ese commit. No equivale a un despliegue ni a una entrega real de correo.

## Siguiente integración

1. Cuenta/dominio/remitente/plan por capturas y11765 sandbox accepted según operador. No repetir. Configurar dirección propia en Secret BREVO_QA_RECIPIENT, desplegar11766 solo a staging y autorizar un correo desde su pantalla privada. Confirmar sus seis cifras y compartir solo el reporte seguro. Es diagnóstico, no acceso de cuenta; no aplicar SQL de outbox o habilitar recuperación por su resultado.
2. Emisión/canje de cuenta unificada y vinculación de identidades: verificación, cambio de correo, sesiones, permisos, consentimiento y migración desde respaldos actuales. Google opcional requiere su propio cliente y validación.
3. Resolver recibos inciertos y persistencia inmutable de mensajes; controles de cuota diarios compartidos y preferencias. No enviar enlaces vencidos por colas diferidas ni anunciar entrega a partir de aceptaciónAPI.
4. Implementar receptor y flujo simple; backup/retención/cifrado/restauración completos antes de retirar503. QA real con recepción/canje y fallos; habilitación expresamente acotada después de aprobar.

Fuentes oficiales: [API transaccional](https://developers.brevo.com/reference/send-transac-email), [idempotencia](https://developers.brevo.com/docs/heterogenous-versions-batch-emails), [límites gratuitos](https://help.brevo.com/hc/es/articles/208580669-FAQ-Cu%C3%A1les-son-los-l%C3%ADmites-del-plan-Gratis), [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) y [verificación de Google en backend](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
