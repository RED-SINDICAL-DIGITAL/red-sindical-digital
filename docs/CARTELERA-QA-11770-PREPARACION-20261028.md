# Cartelera 11770 · laboratorio listo, ejecución remota pendiente

Se solicitó validar D1 aislado y recepción real. No se encontró un conector de Cloudflare en la búsqueda disponible. El navegador Work estaba sin sesión; el operador eligió Google y su cuenta mediante browserAuth. Cloudflare devolvió «Unable to sign in. Try again or use your email and password». No se insistió ni se cambió de método. Esto no demuestra un bloqueo antibot ni un problema de la cuenta del operador.

Se preparó un Worker nuevo y separado: `releases/uadav-cartelera-qa-11770.js`, con manifiesto e instrucciones. Incluye exactamente el core del Worker 11770 publicado en GitHub y lo ejecuta sobre prefijos de tablas ficticias en una D1 nueva y exclusiva. Rechaza bases operativas, host de staging/producción, rutas operativas, peticiones sin clave y orígenes ajenos.

La página guía tres fases D1 y un único aviso real. Guarda el progreso, admite consulta/reintento de fases confirmadas y limita el aviso al destinatario de QA. La recepción solo se confirma por declaración explícita del operador después de ver el mensaje. La aceptación de Brevo nunca marca por sí sola `real_email_received`.

Pruebas locales: **419 aprobadas**, incluidas la protección de bases ajenas, las tres fases con el Worker real, namespaces e índices FTS, rollback/restauración, reintentos y proveedor simulado. Se tolera únicamente la tabla reservada `_cf_KV` documentada por Cloudflare; no se lee su contenido. Referencia: https://developers.cloudflare.com/d1/best-practices/import-export-data/

No se creó ni desplegó el Worker QA desde esta sesión, no se accedió a una D1 remota y no se envió correo real. No se activó `EVENT_ATOMIC_STAGING` ni se modificó producción o el Worker operativo 11770. Para completar la solicitud hace falta que el operador cree el Worker/D1 de QA e ingrese los secretos directamente en Cloudflare siguiendo `releases/11770-CARTELERA-QA-INSTRUCCIONES.md`. Compartir solo el JSON seguro del laboratorio, nunca claves o secretos.
