# Bolsa · núcleo preparatorio de recuperación por correo

26/10/2026. **Código escrito y pruebas locales aprobadas; no integrado ni desplegado.** No se aplicó SQL remoto, no se configuró proveedor/remitente/secretos y no se envió correo real. Worker 11764, su ZIP y el laboratorio aprobado permanecen idénticos. Las rutas públicas de recuperación siguen respondiendo 503 por el bloqueo existente.

## Problema que prepara

Un fallo entre guardar el enlace y enviar el correo puede dejar un enlace activo sin entrega confirmada, repetir envíos o perder la referencia del primer intento. El módulo prepara una bandeja transaccional con solicitud cifrada, identidad estable de envío y activación del token después de una respuesta válida del proveedor. La clave del contratante y su vínculo de cuenta solo cambian cuando se canjea el token mediante el helper original ya probado.

Archivos nuevos: `scripts/job-recovery-outbox.mjs`, `migrations/staging/20261026_job_recovery_outbox.sql` y `tests/job-recovery-outbox.test.mjs`. El SQL es un **borrador no incluido en el instalador**. No aplicarlo sobre staging operativo o producción en esta etapa. `worker.js` no importa ni contiene este módulo; no hay variable que permita habilitarlo en el Worker actual.

## Estados y transacciones

| Paso | Comportamiento preparado |
|---|---|
| Solicitar | Verifica correo contra el contacto privado de la oferta y la revisión de su credencial. Guarda en una fila el hash del token, payload cifrado y datos de deduplicación. Todavía no inserta el token en la tabla que permite canjearlo. |
| Repetir | Identificador de solicitud único y un solo intento activo por oferta/revisión. Las repeticiones y solicitudes paralelas no generan otro intento activo. |
| Enviar | Un dispatcher toma lease D1; entrega al adaptador siempre el mismo payload e identificador. Se procesa un intento por invocación. |
| Confirmar aceptación | En un único lote D1: revalida oferta, credencial, lease y plazo; invalida tokens anteriores; inserta el nuevo token canjeable; guarda recibo del proveedor y borra el payload cifrado. |
| Canjear | El helper original consume una vez, cambia hash/revisión de credencial y revoca el vínculo anterior de cuenta en su transacción. |
| Fallar o vencer | Error genérico, reintento acotado o estado final sin token nuevo activo. Un lease ajeno no se libera ni se sobrescribe. |

La aceptación del proveedor y la transacción D1 **no forman una transacción distribuida única**. El diseño requiere que el proveedor deduplique por identificador y conserve la misma respuesta durante al menos una hora. Así puede reconciliarse un envío aceptado cuya respuesta o confirmación D1 se perdió. Una respuesta con ID válido solo prueba aceptación del proveedor: **no acredita entrega ni lectura del mensaje**. Ese circuito aún necesita pruebas reales.

## Contrato interno y límites

- Factory por contexto de operación: `createJobRecoveryOutbox({db,encryptionKey,mode:'staging-only'})`. Usa sesión D1 `first-primary` si está disponible. El modo declarativo no sustituye el aislamiento real de la base futura.
- `enqueue({jobId,recipient,requestId,actorHash})`: resultado uniforme `{accepted:true}` para solicitudes válidas, inexistentes, correo distinto, duplicadas o limitadas. El futuro HTTP debe derivar `actorHash` del contexto del servidor, gestionar errores y tiempos sin enumeración y aplicar su control de abuso; no reenviar ese dato del body del navegador.
- `dispatch(adapter)`: el adaptador debe declarar una ventana de idempotencia de al menos una hora y devolver `{id}` válido. No hay adaptador de proveedor real en esta entrega.
- Payload de destinatario/token cifrado con **AES-256-GCM**, IV aleatorio de 96 bits y datos autenticados ligados a oferta, revisiones, hash del destinatario/token y vencimiento. El token no queda en texto plano en la bandeja ni se devuelve al solicitante.
- TTL de 15 minutos desde la solicitud; lease de 30 segundos; timeout de envío de hasta 5 segundos; máximo cinco intentos con espera progresiva. El adaptador debe respetar cancelación y reintentar con el mismo cuerpo.
- Límite de actor: cinco solicitudes por diez minutos. Límite de nuevas emisiones: tres por oferta/hora. Hasta 1.000 intentos activos. Operaciones y guardas atómicas en D1.
- Cambios de contacto/revisión/credencial o eliminación antes de guardar o confirmar cancelan el intento obsoleto. La solicitud de recuperación por sí sola conserva la clave y el vínculo existentes.
- Las excepciones almacenadas/devueltas usan códigos permitidos; no incluyen errores SQL, cuerpo del proveedor, token, correo o clave de cifrado.

La clave de cifrado futura debe ser exclusiva de staging, guardarse como secreto y acompañarse de una política de recuperación/rotación. No reutilizar claves de Admin o de los laboratorios ni publicarla. Esa gestión todavía no está configurada.

## Pruebas y alcance

**20 grupos nuevos** aprobaron con SQLite transaccional y proveedores simulados: cifrado/autenticación de metadatos, token inactivo antes del recibo, igualdad de resultado, solicitudes/dispatchers simultáneos, límites, SQL fallido, respuestas perdidas, recibos inválidos, timeout con cancelación ignorada, agotamiento, expiración, cambios de titular/contacto, lease ajeno/abandonado y canje único mediante el helper original. También se comprobó que tokens anteriores se invalidan solo si confirma todo el lote y que las rutas públicas permanecen bloqueadas.

Suite focalizada total: **102 pruebas Node/SQLite aprobadas**, frente a 82 anteriores. **19 comprobaciones workerd aprobadas**, frente a 18: el nuevo control valida carga del módulo y rechazo por modo/proveedor antes de DB; no ejecuta SQL de esta bandeja contra D1 remoto. Generadores, fuente embebida, sintaxis y diff aprobados. No se repitieron pruebas UI por un módulo sin exposición frontend. La suite general conserva sus fallos previos ajenos a Bolsa.

Código y pruebas guardados en commit `253bd484b0c6d2abf382de4af2022d9d18329972`, exclusivamente en la rama Worker staging. CI [Bolsa 40406193132](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40406193132) y [Radio 40406193109](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40406193109), ambas `success` para ese commit. El informe del operador del laboratorio quedó antes en `9c6e6f7735dacf78523670d964429bd5050d0a41`.

Las ocho fases del laboratorio 11764 que informó el operador corresponden al núcleo anterior de Bolsa y su helper de canje. **No prueban remotamente esta bandeja nueva.** No pedir que repita ese laboratorio para acreditar un código que aún no contiene.

## Proveedor y trabajo pendiente antes de habilitar

El módulo no selecciona un servicio. Resend es una opción compatible para evaluar: documenta el uso de la misma clave y payload para reintentos durante 24 horas. Requiere un dominio verificado; permite utilizar un subdominio para separar los envíos. La elección sigue pendiente, sin cuenta nueva, compra o configuración realizada desde Work.

Fuentes oficiales consultadas el 26/10: [idempotencia de Resend](https://resend.com/docs/dashboard/emails/idempotency-keys), [verificación de dominios](https://resend.com/docs/dashboard/domains/introduction), [precios y límites publicados](https://resend.com/pricing) y [API de envío de Cloudflare](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/). No se atribuye idempotencia a un transporte que no la haya documentado y validado.

Para pasar a una entrega integrada faltan:

1. Elegir proveedor y remitente/subdominio de **staging** verificado, con credencial exclusiva y permiso de envío acotado. No modificar DNS o credenciales productivos.
2. Implementar el adaptador, mensajes y enlaces de recuperación seguros, con recibos, clasificación de fallos y cuerpos estables en los reintentos.
3. Integrar HTTP/UI, validaciones, rate limits del contexto real y respuestas sin enumeración. Revisar el ciclo completo del token y de la credencial.
4. Incluir la bandeja cifrada en el backup privado y diseñar restauración, retención, rotación de claves y auditoría sin reenvíos indebidos. La lista exportada por el Worker actual aún no incluye esta tabla.
5. Probar D1 remoto y un correo real autorizado: envío, recepción, canje, vencimiento, reintentos/duplicación, pérdida de respuesta y fallo SQL. Solo después evaluar la habilitación con código/flags expresos y revisión final.

Mientras tanto no corresponde otro despliegue del Worker principal ni aplicar este SQL. Permanecen vigentes los otros pendientes de Bolsa y la QA de vencimiento real desde el 27/10 a las 00:00 de Argentina.
