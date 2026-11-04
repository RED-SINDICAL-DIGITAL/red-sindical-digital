# Cartelera y recuperación · 4 de noviembre de 2026

## Recuperación real de una oferta ordinaria: aprobada en staging
Oferta ficticia JOB-MW2D47AR-9D7402F1F05D. Se ocultó desde Admin antes de solicitar recuperación. El usuario recibió el correo y completó la recuperación. La consulta D1 aportada por el operador mostró state=redeemed, attempts=1, last_error=NULL, creado 17:04:22 UTC, vencimiento 17:19:22 UTC y canje 17:06:49 UTC. Un enlace posterior también permitió consultar postulantes y guardar explícitamente la oferta en Mi Perfil. Las capturas del operador confirman acceso privado sin postulantes, rechazo del código original y oferta cerrada disponible en Mis trabajos. No se guardan tokens, claves ni correos en esta evidencia.
La revisión pública 11770-public-recovery-20261104 fue verificada desplegada y habilitada solo en staging. Esta evidencia corresponde a esta oferta, no a todos los casos posibles.

## Correcciones de avisos de Cartelera
La selección de la cola excluye reservas activas, envíos inciertos y reintentos aún no vencidos, para que no ocupen el cupo e impidan procesar avisos posteriores listos. La aceptación del proveedor solo cuenta como confirmada si D1 confirma que la reserva aún pertenecía al envío. Perder la reserva no produce un falso éxito ni un reenvío automático.
Se conserva qa-only y el destinatario de pruebas. No se amplían destinatarios ni se despacha correo histórico. No hay migraciones o cambios de variables.
463/463 pruebas del Worker aprobadas, incluyendo concurrencia, respuesta perdida, aceptación durable, pérdida de reserva y avance de la cola. El Worker completo difiere del paquete de recuperación únicamente en el despachador de Cartelera.
Paquete: releases/worker-UADAVSTREAM-V11.7-11770-avisos-cartelera-20261104.js
SHA256: 2fa3348aefb6b16cb30028a5c9da0e061116248bbfcacbfc0b0ca82f308be22e

## Pendientes
Este paquete está preparado, no desplegado por esta tarea. Correo general de Cartelera sigue pendiente: necesita consentimiento explícito y selección autorizada de destinatarios, corte de antigüedad para no enviar cola vieja y validación real de recepción. No cambiar CARTELERA_MAIL_STAGING para intentar habilitarlo: el Worker solo admite qa-only.
Producción no modificada.
