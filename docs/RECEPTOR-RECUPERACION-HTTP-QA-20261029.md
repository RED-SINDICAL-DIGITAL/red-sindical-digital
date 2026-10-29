# Receptor compatible con recuperación HTTP QA — 29/10/2026

El receptor continúa aceptando exclusivamente la oferta ficticia JOB-QA-MAIL-LIVE y el origen exacto de Pages staging. No amplía recuperación a ofertas reales ni cambia el bootstrap que limpia el fragmento antes de cargar recursos.

Solo tras Confirmar recuperación consulta GET /api/bolsa_trabajo/acceso/capabilities sin credenciales, cuerpo o token; con http_qa_enabled=true y public_job_key_recovery_enabled=false canjea por POST /api/bolsa_trabajo/acceso/restablecer. Si la QA HTTP no está disponible conserva compatibilidad con el recorrido privado anterior. No hay canje ni solicitudes al abrir el correo. Los reintentos conservan el modo y la clave candidata original; el cierre aborta operaciones y borra la pantalla. La nueva respuesta HTTP exige success/job_id/revision exactos y revisión 2 para la oferta ficticia. Guardar en Mi Perfil sigue requiriendo consentimiento y la misma cuenta.

Suite final Pages 680/680 y Worker 437/437. Prueba del Worker completo con SQLite, proveedor simulado y recuperación HTTP hasta bandeja privada aprobada. No hubo correos reales en tests.

El Worker necesario está en la rama release/radio-studio-staging-rc-20261020, archivo releases/worker-UADAVSTREAM-V11.7-11770-recovery-http-qa.js. Flag opcional JOB_RECOVERY_HTTP_STAGING=qa-only, solo Worker staging. Instrucciones completas: docs/RECUPERACION-HTTP-QA-INTEGRADA-20261029.md en esa rama. No requiere cambiar secretos, bindings o cron. Falta desplegar y confirmar recepción/canje real de esta integración; no declarar recuperación pública terminada.
