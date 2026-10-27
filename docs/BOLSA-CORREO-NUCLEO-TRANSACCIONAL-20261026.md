# Bolsa · núcleo transaccional de recuperación por correo

Actualizado el 27/10/2026 UTC (noche del 26/10 en Argentina). **Código preparatorio probado localmente; recuperación pública deshabilitada.** El diagnóstico de recepción11766 fue informado como `received` por el operador. No prueba un canje de recuperación ni una cuenta por correo. El Worker principal y su ZIP11766 no cambiaron en este avance.

Esta revisión reemplaza el diseño anterior que exigía el recibo del proveedor para hacer canjeable un enlace. Ese requisito era una decisión técnica preparatoria, no una condición comercial del usuario. Con Brevo podía dejar inutilizable un enlace realmente recibido cuando se perdía la respuesta API. No tratar `duplicate_parameter` como aceptación ni fabricar recibos.

## Contrato actual

| Operación | Comportamiento escrito |
|---|---|
| Solicitar | Comprueba contacto privado de la oferta y revisión de credencial. Guarda hash de token aleatorio de256bits, plazo15min y payload completo cifrado con AES-GCM. La respuesta uniforme `{accepted:true}` no contiene el token. |
| Preparar mensaje | Antes del encolado, renderiza una vez destinatario, remitente, asunto, HTML/texto, enlace y UUID. Persiste esos bytes dentro del cifrado y su hash; el contexto de la clave del proveedor queda representado por una huella, nunca por la clave real. |
| Enviar | Reserva lease D1 antes de llamar al adaptador. Reintenta únicamente los mismos bytes/UUID dentro del plazo; una intención no despachada todavía no puede canjearse. |
| Aceptar en API | Un201 y `messageId` válido registran aceptación auténtica y eliminan el payload. No cambian la credencial, no invalidan enlaces anteriores y no acreditan entrega. |
| Recibir sin respuesta API | Quien posee el token recibido puede canjearlo, aunque el recibo sea incierto, haya un envío en curso o se hayan agotado reintentos. Se exige al menos una reserva de despacho, plazo vigente y revisiones actuales. El hash almacenado o las seis cifras del diagnóstico no sirven como prueba. |
| Canjear | Un lote D1 revalida token/oferta/credencial, consume el token, borra su payload, rota hash/revisión de acceso, invalida tokensV2 anteriores y revoca vínculos previos de esa oferta. No crea cuentas ni transfiere perfiles artísticos. |
| Repetir tras perder respuesta | Solo la misma credencial nueva y su revisión vigente permiten confirmar un canje ya hecho, sin una segunda rotación. Una credencial distinta o una revisión posterior se rechazan. |
| Revocar o vencer | Cambios de oferta/contacto/credencial o vencimiento impiden el canje. La clave anterior se conserva hasta un canje válido; un fallo SQL revierte el lote entero. |

La posesión del enlace recibido demuestra control de ese secreto temporal; el recibo del proveedor es evidencia de transporte, no autoridad de acceso. No se envían claves permanentes por correo. Un GET futuro no consumirá el enlace: el receptor deberá exigir confirmación y POST. Ese receptor aún no está implementado.

## Archivos y límites

- `scripts/job-recovery-outbox.mjs`: `createJobRecoveryOutbox({db,encryptionKey,mode:'staging-only',prepareDelivery})`, métodos `enqueue`, `dispatch` y `redeem`. Usa `first-primary` cuando existe. El futuro HTTP debe derivar `actorHash` del servidor, controlar abuso y tiempos uniformes; nunca confiar en ese dato enviado por el cliente.
- `scripts/brevo-recovery-message.mjs`: snapshot restringido y validado. Cambio de plantilla/remitente no recompone mensajes pendientes; cambio de contexto de API key o destinatario fuera de la lista permitida bloquea antes del transporte. `.send` exige snapshot, sin fallback a un mensaje regenerado.
- `migrations/staging/20261026_job_recovery_outbox.sql`: borrador revisado, estados con `redeemed_at`/`redeemed_secret_hash`. **No es una actualización en sitio de un borrador anterior.** Solo el laboratorio sintético con huella/base verificadas puede instalarlo en esta entrega. No forma parte del instalador operativo ni debe aplicarse manualmente a staging operativo o producción.
- Token15min, lease30s, transporte5s, máximo cinco intentos; ventana mínima de deduplicación935000ms. Brevo declara30min. Límite atómico por actor cinco/10min, por oferta tres/hora, máximo1000 intenciones activas. Estos controles internos no sustituyen presupuesto global de correo ni medidas HTTP contra abuso.
- Payload completo cifrado; no token/destinatario plano en el outbox, logs o errores. El laboratorio usa exclusivamente una casilla y secretos ficticios. Su buzón simulado puede conservar los mensajes ficticios para verificar el algoritmo; nunca se debe usar como almacenamiento de correo real.

El cambio no importa este módulo en `worker.js`. `/api/bolsa_trabajo/acceso/solicitar` y `/restablecer` siguen503 incondicional. No existe un flag para habilitar este núcleo en el Worker actual. Restore operativo, cuentas generales, Google, Pages y cron quedan fuera del cambio.

## Evidencia y siguiente paso

32grupos del núcleo, seis de snapshot,17 de mensajes/transporte y13 del laboratorio cubren concurrencia, rollback, respuestas perdidas, canje anticipado respecto de la respuestaAPI, cambio de fuente durante commit, destinatarios/cuerpos alterados, rotación de contexto, idempotencia y acceso real a la bandeja privada con clave vieja/nueva. La suite focalizada anterior al último caso adicional aprobó197 grupos; el archivo actualizado se comprueba por separado y CI registra el total final. Los23 controles workerd también aprobaron localmente. Red simulada y SQLite no equivalen a D1 remoto ni a dispositivos físicos.

La guía `BOLSA-11766-LABORATORIO-RECUPERACION.md` prepara siete fases nuevas en el **laboratorio de Bolsa existente**, conservando las ocho anteriores. No envía correos reales. Su despliegue y resultado D1 remoto siguen pendientes. Después faltan HTTP/receptor, UX de cuenta, control de abuso/cuotas, exportación/restauración/retención/rotación de claves y QA integral antes de habilitar recuperación.

Referencia técnica: [OWASP, Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html). Se aplican los principios de secreto temporal de un uso, plazo y cambio de acceso solo tras la prueba válida. No se declara conformidad integral: quedan pendientes varias capas HTTP y de producto.
