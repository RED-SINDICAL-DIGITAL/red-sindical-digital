# Correo de acceso y Brevo · preparación aislada · 26/10/2026

Decisión funcional en `CUENTA-UNICA-Y-ACCESO-SIMPLE-20261026.md`. El usuario quiere recuperar accesos desde su correo sin guardar códigos largos; aceptó cuenta única y Google opcional. Brevo gratuito se prioriza por volumen, sin cuenta del proveedor, remitente o credencial configurados todavía.

## Código escrito, sin despliegue

- `scripts/access-mail-message.mjs`: tres mensajes de acceso, verificación de correo y recuperación de oferta. Una acción principal, HTML/texto, hora argentina 24h y botón de al menos 48 px; sin imágenes ni recursos externos. Token aleatorio opaco en fragmento del enlace; nunca claves permanentes de cuenta/Admin. Datos de emisión/vencimiento fijos para que el texto no cambie al reintentar.
- `scripts/brevo-staging-mail.mjs`: transporte HTTPS fijo a `api.brevo.com/v3/smtp/email`, sin redirecciones ni credenciales del navegador. Emisor acotado a `correo-staging.uadavstream.com.ar`, modo explícito y lista de 1–10 destinatarios para QA. El modo declarativo no verifica propiedad del dominio ni consentimiento real: su configuración futura debe hacerlo.
- Cuerpo construido por el servidor: un destinatario, sin CC/BCC, adjuntos, importación de contactos, cabeceras arbitrarias o acceso a Gmail. Clave API solo en header del proveedor. El transporte no contiene una clave real ni ejecuta llamadas al importarse.
- UUID de la intención como `headers.idempotencyKey`; mismo cuerpo y plazos al repetir con igual configuración. Respuesta JSON/UTF-8 acotada a 8 KiB y tiempo máximo de 5 segundos, incluyendo lectura del cuerpo. Cancelación, redirección, cuota, rate limit, error de configuración, respuesta inválida y recibo faltante fallan con códigos seguros.
- Solo HTTP201 y un `messageId` válido producen aceptación. Su SHA256 se normaliza como identificador interno `brevo:<hash>`; no se inventa un ID del proveedor. No es constancia de entrega/lectura.
- La adaptación al outbox de Bolsa conserva el UUID, token y vencimiento originales. Para cuentas generales solo se preparó el mensaje/transporte: no existe aún su sistema de emisión/canje, federación Google, endpoint o pantalla receptora.

**No están importados ni embebidos en `worker.js`.** No hay despliegue, API key, cuenta Brevo, envío real, SQL remoto o DNS nuevos. `/acceso-correo.html` es un destino reservado todavía no implementado. No usar esos enlaces con personas reales ni aplicar el SQL previo para habilitar el correo.

## Idempotencia: diferencia importante con Resend

La documentación de Brevo consultada el26/10 indica una ventana de deduplicación de **30 minutos** y error `duplicate_parameter` en un reintento, en lugar de prometer el recibo original. No declaramos una hora ni suponemos que ese error proporciona el `messageId` anterior.

El guard del outbox pasa de una hora arbitraria a un mínimo calculado: **15 minutos de vida del token + 30 segundos de lease + 5 segundos de envío = 935.000 ms**. Sigue rechazando antes de DB un proveedor que no cubra ese plazo. Brevo declara su ventana real de30min; no se envía de nuevo una intención vencida ni se extiende su validez para el día siguiente.

Una aceptación201 permite activar el token en el lote D1 ya diseñado. Si el proveedor aceptó pero se perdió su respuesta, el siguiente `duplicate_parameter` queda **sin confirmar**. No produce recibo falso ni un token canjeable, y conserva la credencial/vínculo anterior. Tras los cinco intentos limitados se borra el payload cifrado y no se reenvía esa intención. Está probado como comportamiento de seguridad, **no como recuperación satisfactoria del usuario**.

Antes de habilitar falta resolver esa recepción incierta con evidencia auténtica o un diseño revisado y ensayado. No reemplazarla por tratar cualquier error de duplicado como éxito. También falta proteger la inmutabilidad del mensaje entre despliegues/cambios de remitente: el outbox actual cifra token/destinatario, pero aún no persiste todo el cuerpo renderizado/configuración del proveedor.

## Pruebas y límites

17 grupos del transporte/mensajes y3 nuevos de composición con el outbox, además de los20 previos del outbox, aprobaron localmente. Incluyen: dirección ajena/inyección, permisos del emisor, payload restringido, fecha en medianoche argentina, reintentos idénticos, token vencido, respuesta perdida/duplicado, canje D1 único, preservación del acceso anterior, recibos malformados, respuestas demasiado grandes, errores saneados, timeout/cancelación y ausencia de importación en el Worker operativo.

La red de esos tests es simulada y los datos son ficticios. Los resultados no prueban Brevo real, la página de destino, D1 remoto, recepción de correo ni UX física. Los mensajes tienen estructura accesible básica, pero falta inspección visual de clientes de correo y validación con teclado/lectores/usuarios.

Resultados locales: **122 pruebas focalizadas Node/SQLite aprobadas** y **20 comprobaciones workerd aprobadas** con el motor fijado1.20261025.1. También aprobaron cotejo de fuentes embebidas/laboratorios congelados y diff; SHA de Worker/ZIP11764 y laboratorio sin cambios. CI incorpora los archivos nuevos. No repetir el laboratorio11764: no contiene este código. La oferta de vencimiento real mantiene su fecha y su cron original.

Código y decisión guardados en `09ac96fad850a8016e2f2bc8fa9d2b7696a93932`, exclusivamente Worker staging. CI [Bolsa40413223664](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40413223664) y [Radio40413223652](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40413223652) confirmadas `success` para ese commit. No equivale a un despliegue ni a una entrega real de correo.

## Siguiente integración

1. Cuenta gratuita en Brevo creada por el usuario. Remitente y subdominio de staging verificados, credencial exclusiva mediante secretos y un destinatario de prueba autorizado. Sin contratación, pago o cambio productivo.
2. Emisión/canje de cuenta unificada y vinculación de identidades: verificación, cambio de correo, sesiones, permisos, consentimiento y migración desde respaldos actuales. Google opcional requiere su propio cliente y validación.
3. Resolver recibos inciertos y persistencia inmutable de mensajes; controles de cuota diarios compartidos y preferencias. No enviar enlaces vencidos por colas diferidas ni anunciar entrega a partir de aceptaciónAPI.
4. Implementar receptor y flujo simple; backup/retención/cifrado/restauración completos antes de retirar503. QA real con recepción/canje y fallos; habilitación expresamente acotada después de aprobar.

Fuentes oficiales: [API transaccional](https://developers.brevo.com/reference/send-transac-email), [idempotencia](https://developers.brevo.com/docs/heterogenous-versions-batch-emails), [límites gratuitos](https://help.brevo.com/hc/es/articles/208580669-FAQ-Cu%C3%A1les-son-los-l%C3%ADmites-del-plan-Gratis), [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) y [verificación de Google en backend](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
