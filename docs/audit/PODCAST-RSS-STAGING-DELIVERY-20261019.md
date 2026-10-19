# RSS de podcasts — entrega para staging — 2026-10-19

## Implementado
- Admin > Podcasts: vista previa sin publicación; alta/configuración de fuentes; importación manual; frecuencia entre 1 y 168 h; opción de actualización/publicación automática.
- RSS 2.0 y Atom con enclosure de audio/video, CDATA, namespaces, carátulas, fechas y duración. Hasta 1 MiB por respuesta, 200 episodios compatibles por lectura y 3 redirecciones.
- Las fuentes requieren HTTPS público, sin credenciales, puertos alternativos ni IP literal. Cada redirección se valida. No se siguen DTD/entidades externas.
- D1: podcast_sources y podcast_entries. Identidad estable por fuente+GUID, respaldo enclosure. Importación idempotente y transaccional, lease por fuente y protección frente a cambios de configuración durante una lectura.
- Episodios importados separados de content_items manual. La sincronización no borra ausentes ni sobrescribe el contenido manual. Ocultar un episodio se conserva en lecturas posteriores.
- ETag/Last-Modified, error legible, última lectura correcta y reintentos por intervalo.
- Catálogo público reúne manual+RSS y evita duplicar URLs idénticas, respetando mayúsculas y query strings. Una caída parcial conserva lo disponible y ofrece reintento. Compatible con Worker anterior sin RSS.
- Sincronización programada opt-in: sólo fuentes active + auto_publish y sólo si PODCAST_RSS_SYNC_ENABLED=true. Máximo tres fuentes vencidas por ejecución; programar el trigger según la cantidad de fuentes y los límites del plan.
- No se agregó ingestión automática de YouTube/Spotify ni descarga de medios; siguen en el plan de adaptadores oficiales.

## Despliegue manual
1. Reemplazar el código de uadav-api-staging con worker.js de este commit. Conservar bindings D1 DB y KV UADAV_DB y los secretos existentes. No editar producción.
2. Dejar PODCAST_RSS_SYNC_ENABLED sin definir o false en esta primera aceptación.
3. Admin staging > Podcasts: registrar una fuente pública autorizada, Ver episodios antes de importar, revisar, Guardar fuente e Importar episodios ahora. Comprobar audio/video y portada.
4. Revisar el catálogo público, repetir importación (cero duplicados), ocultar un episodio y repetir (debe seguir oculto).
5. Para activar actualización programada después de la aceptación: elegir la opción automática de esa fuente, configurar PODCAST_RSS_SYNC_ENABLED como texto true y asegurar que el Worker tenga Cron Trigger. Puede usarse un trigger existente; si no existe, considerar */15 * * * * (UTC). El intervalo individual limita cada lectura.
6. Si hay problemas: desactivar el flag o pausar las fuentes. No se borran episodios ni fuentes. No se necesita borrar o recrear D1.

Las tablas se crean mediante CREATE TABLE IF NOT EXISTS al usar el módulo; no hay migración destructiva.

## Verificación realizada
Integración Worker con SQLite real y KV aislados: XML/Atom mixto, enlaces y redirecciones no permitidos, límites, autenticación, vista previa sin publicar, deduplicación, actualización, preservación de ocultos, rechazo de fuente repetida, transacción fallida, 304, fallos de red, lease y cron opt-in.
Pruebas de carga pública: manual+RSS, prioridad editorial manual, URL sensible a mayúsculas, compatibilidad 404, error total y parcial.
28 pruebas existentes de podcasts, controles nativos y revisión de Admin aprobadas, más 4 de carga pública. Regresiones aisladas de Radio Studio, interacción Radio y Bolsa de Trabajo aprobadas.
Scripts inline de Admin y JS nuevos validados sintácticamente.
No se desplegó el Worker ni se activó cron en Cloudflare durante esta entrega. No se registraron feeds reales ni se publicaron episodios remotos. La UI privada y aceptación real esperan el despliegue de staging.

## Límites
La importación procesa hasta 200 episodios de la ventana actual del feed; no recorre automáticamente archivos históricos paginados. El catálogo RSS sirve hasta 1000 episodios visibles. El soporte del formato/codec final depende del navegador. Feeds premium/privados, XML con DTD y formatos sin medios compatibles se rechazan o no se importan.
Las validaciones de URL no constituyen una resolución DNS propia; se mantiene la protección de red de la plataforma de ejecución. Validar fuentes públicas autorizadas.
