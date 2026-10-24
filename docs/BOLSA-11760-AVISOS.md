# Bolsa · avisos de vencimiento en Admin staging

El módulo compartido `uadav-jobs-expiry-admin.js` se monta dentro de Auditoría con el transporte privado existente de Admin; no obtiene ni guarda su clave. No hace peticiones al cargar la pantalla. El operador revisa hasta cinco avisos, confirma el envío y recibe un resultado verificado. Una escritura incierta o una revisión desactualizada obliga a revisar otra vez, sin reintentos automáticos.

La herramienta solo funciona con el origen y API exactos de staging. Los títulos se muestran como texto. Al salir de Auditoría se descartan respuestas tardías. Las fechas se comprueban como días calendario y los lotes como respuestas completas, sin asumir que una respuesta HTTP exitosa acredita el envío.

El comprobador de respaldos también verifica el historial de vencimientos y su relación con cuentas y avisos visibles. Admite marcas de deduplicación retenidas después de borrar una oferta o un aviso, pero rechaza referencias a cuentas ausentes, duplicados, fechas inválidas y snapshots incompletos.

Requiere Worker **11760** y `migrations/staging/20261024_job_expiry_notices.sql`, preparados en la rama Worker. El despliegue de Worker sigue siendo manual. Con el Worker 11759 la revisión informa que la función todavía no está preparada; los circuitos anteriores siguen disponibles. La guía de instalación y QA está en `docs/BOLSA-11760-AVISOS-STAGING.md` de esa rama.

92 pruebas específicas aprobadas localmente. La entrega real de estos avisos permanece pendiente de despliegue y QA en Cloudflare. No se habilitan correo, restauración ni producción.
