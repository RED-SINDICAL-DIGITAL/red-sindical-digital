# Recuperación HTTP integrada para QA privada — 29/10/2026

## Alcance
Worker 11770, exclusivamente uadav-api-staging.uadavstream.workers.dev. Nuevo interruptor JOB_RECOVERY_HTTP_STAGING=qa-only. Sin él, las rutas de recuperación antigua siguen 503. Incluso activado solo admite la oferta ficticia cerrada creada por /qa/recuperacion-oferta; no recupera ofertas reales. No ejecutar migraciones ni cambiar claves, bindings, cron o producción para esta ronda.

La capa scripts/job-recovery-http.mjs está ahora embebida y conectada. Reutiliza validación de esquema, migración y destinatario, motor outbox cifrado, reserva única de envío, canje transaccional y verificación de bandeja privada de la QA existente. No duplica un sistema de correo. El envío sigue siendo explícito desde la herramienta privada Admin; una solicitud pública no envía correo por sí sola. Nunca se devuelve una credencial al solicitar recuperación.

El receptor acceso-correo.html conserva el token solo en memoria, limpia el fragmento antes de cargar recursos y no hace solicitudes ni canje al abrir el enlace. Al confirmar consulta capabilities y usa la ruta HTTP QA si está activada. Conserva el mismo modo y nueva clave candidata en reintentos; cerrar aborta operaciones y borra la pantalla. El recorrido anterior privado sigue compatible con la opción apagada. Guardar en Mi Perfil exige consentimiento y la misma cuenta autenticada.

## Despliegue humano
1. Esperar que Pages staging publique acceso-correo.html y uadav-email-access.js?v=11770.2 de su rama de staging.
2. En Cloudflare abrir únicamente uadav-api-staging y pegar releases/worker-UADAVSTREAM-V11.7-11770-recovery-http-qa.js completo. Desplegar.
3. Agregar variable de texto JOB_RECOVERY_HTTP_STAGING=qa-only y desplegar. Conservar las opciones existentes de Cartelera y Bolsa y sus secretos. Esta opción NO activa recuperación de ofertas reales.
4. Consultar /api/bolsa_trabajo/acceso/capabilities: http_qa_enabled=true y public_job_key_recovery_enabled=false.
5. Abrir /qa/recuperacion-oferta, ingresar con formulario seguro Admin y crear una oferta ficticia nueva. Solicitar el enlace y enviar una sola vez al correo QA ya configurado. No usar datos de terceros ni reenviar si hay estado incierto.
6. Abrir el enlace del correo, confirmar recuperación, comprobar bandeja privada y guardar comprobante o vincular explícitamente a Mi Perfil. Confirmar recepción real y copiar resultado seguro, nunca enlace/token/clave ni respaldo completo al chat.

Reversión: quitar JOB_RECOVERY_HTTP_STAGING. Vuelve a la QA privada anterior y se bloquean las rutas nuevas. No se borran registros ni credenciales. Nunca activar recuperación general de ofertas antiguas con esta opción.

## Validación local
Suite final Worker 437/437; suite final Pages 680/680. Prueba del Worker completo con SQLite y Brevo simulado: creación ficticia, solicitud pasando por HTTP, envío inmutable, canje HTTP y repetición con una sola rotación, bandeja privada nueva válida, clave anterior inválida y prueba marcada completa; no altera cron ni KV.

Pendiente: despliegue y recepción/canje real de ESTA integración HTTP. No se considera completado por la prueba privada histórica. Vencimiento automático remoto de destacados también sigue pendiente.

SHA256 Worker: 099ea1ac2ec68f59fb37db6af4676919ab6e6bfc13a918476224550af0d290db
