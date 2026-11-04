# Recuperación de ofertas normales · candidato staging · 4/11/2026

## Estado
Código completo integrado en Worker y Pages; no activado ni desplegado por esta preparación. Worker 11770 con recovery_revision 11770-public-recovery-20261104. Pruebas: 460/460 Worker y 783/783 Pages. El SMTP de la prueba nueva se simuló; falta una prueba real del nuevo circuito con una oferta normal después del despliegue. La QA HTTP anterior sí recibió correo real y fue aprobada por el operador.

## Comportamiento
Modo optativo JOB_RECOVERY_HTTP_STAGING=public, exclusivamente en uadav-api-staging.uadavstream.workers.dev. Sin ese valor se conserva la QA anterior; producción no puede utilizar el nuevo circuito. Solicitar no cambia claves. Exige origen exacto, JSON limitado, referencia UUID, consentimiento, Turnstile completo y acción job_recovery. Respuesta 202 idéntica para correo correcto, incorrecto o oferta inexistente. No devuelve si una oferta pertenece al correo.

Solo envía a un correo válido que coincida con el contacto privado registrado en una oferta de D1 con credencial migrada. No admite IDs JOB-QA ni nuevas direcciones sugeridas por el solicitante. No recupera postulaciones. El dispositivo puede usar Mi Perfil o el comprobante como antes.

Se reutilizan la outbox cifrada, mensaje inmutable, reserva de envío e idempotencia existentes. Límites: 5 solicitudes por IP/10 minutos, 12 canjes por IP/10 minutos, 3 emisiones por oferta/hora y 40 intentos de despacho diarios para esta nueva recuperación. El enlace vence en 15 minutos. Una respuesta perdida conserva referencia y candidato, sin una segunda rotación. El canje revoca la clave anterior y desvincula los accesos anteriores de la oferta; volver a guardarla en Mi Perfil requiere consentimiento explícito. No se restauran intentos o marcadores temporales desde nuevos respaldos.

El receptor admite ofertas normales y revisiones posteriores a 2. No canjea al abrir el correo, limpia el fragmento y conserva el candidato en memoria. Si capacidades no habilita HTTP, no usa el canje privado QA para ofertas normales.

## Despliegue y control
1. Desplegar SOLO uadav-api-staging con releases/worker-UADAVSTREAM-V11.7-11770-recuperacion-publica-20261104.js. Conservar inicialmente JOB_RECOVERY_HTTP_STAGING=qa-only. No modificar producción, bindings, otras variables ni secretos. No hace falta migración: utiliza las tablas ya verificadas por la QA anterior.
2. Esperar Pages y consultar /api/bolsa_trabajo/acceso/capabilities: recovery_revision debe ser 11770-public-recovery-20261104 y public_job_key_recovery_enabled debe seguir false mientras se conserva qa-only.
3. Admin → Auditoría → Respaldo avanzado → Comprobar recuperación por correo. Solo lectura: muestra D1, mantenimiento, Turnstile, correo, cifrado, esquema y QA HTTP aprobada con el cifrado actual. No activa el servicio ni envía.
4. Si Turnstile aparece pendiente, completar primero TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY y permitir el hostname uadav-stream-staging.pages.dev en TURNSTILE_ALLOWED_HOSTNAMES. No apagar Turnstile para forzar la prueba. Las claves se cargan únicamente en Cloudflare.
5. Solo con requisitos aprobados, respaldo privado conservado y sin una QA pendiente: cambiar JOB_RECOVERY_HTTP_STAGING a public y desplegar staging. La pantalla de Bolsa muestra entonces el formulario de recuperación. No cambiar la clave de cifrado ni la del proveedor durante una emisión activa.
6. Validar con una oferta normal de prueba identificada como ficticia, sin publicar ni afectar ofertas de terceros, y con el correo propio autorizado. Comprobar recepción, canje repetido idéntico, clave anterior inválida, acceso nuevo y guardado consentido. No copiar enlaces, tokens o claves al chat ni al repositorio.
7. Si falla, volver a qa-only: las rutas nuevas quedan cerradas sin borrar ofertas o credenciales. Evitar alternar modos mientras haya enlaces pendientes.

## Pruebas nuevas
Worker completo + SQLite: oferta ordinaria, correo preparado/cifrado, transporte Brevo simulado, correo incorrecto sin envío, canje concurrente con una rotación y rechazo de candidato diferente. Pruebas de frontera: apagado, host, origen, consentimiento, campos adicionales, tamaño, autorización, respuesta uniforme, despacho en segundo plano y errores sin filtraciones. Admin de solo lectura no activa ni envía. Interfaz: apagada sin capacidades, referencia estable, correo normalizado, consentimiento y prueba de seguridad; receptor ordinario falla cerrado sin HTTP y acepta una revisión confirmada posterior.

## Lo que no incluye
No habilita correo general de Cartelera ni despacha su cola histórica. Ese circuito requiere consentimiento/selección de destinatarios y control del atraso antes de ampliar qa-only; permanece sin cambios. No constituye un despliegue productivo ni una certificación SMTP del circuito público nuevo.

SHA-256 del Worker completo: 67f827e308a34241db5c3ceb9db5d5e59e5808dd5e4573d39b5ad6c455d90bd7.
