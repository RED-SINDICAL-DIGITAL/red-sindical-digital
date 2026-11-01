# Canal sin lista de subidas — alternativa exacta — 01/11/2026

Solo staging. Activación únicamente cuando playlistItems responde HTTP 404 con playlistNotFound. No se activa por cuota, timeout, permisos genéricos ni una lista exitosa vacía.

La alternativa usa search.list con channelId exacto, type=video, 50 por página y orden por fecha. No busca por nombre. Se descartan respuestas de otros channelId. Cursor ys vinculado a referencia y tipo; páginas posteriores siguen en search y no reintentan playlistItems ni mezclan tokens. Se conserva caché pública existente de diez minutos por página exitosa.

Respuesta source=youtube_channel_search, catalog_limited=true. El frontend identifica que esta consulta alternativa puede no incluir todo el catálogo. YouTube documenta limitaciones de índice y un máximo de 500 videos para búsquedas públicas por canal; no se promete discografía completa. Se usa la cuota de búsqueda existente; no hay proveedores adicionales, rotación de claves ni cambios de variables.

Referencia oficial: https://developers.google.com/youtube/data/reference/rest/v3/search/list

Worker completo listo: releases/worker-UADAVSTREAM-V11.7-11770-canal-exacto-20261101.js. Desplegar manualmente solo en uadav-api-staging. No cambiar secretos, D1, KV, cron o flags. Conserva diagnóstico seguro y corrección UTC de fechas del Worker anterior.

Pruebas Worker: 453/453. tests/youtube-library.mjs aprobado. Casos nuevos: identidad exacta y descarte de videos ajenos; paginación del proveedor alternativo; no activar búsqueda adicional ante cuota; subidas normales conservadas. No usa credenciales reales en tests.

Pendiente después del despliegue humano: solicitar videos del canal UCQJuTjhtb6Oyy2kStA1BUKw y comprobar respuesta, aviso parcial, apertura y paginación real. Un fallback puede devolver cero resultados si el índice del canal no los ofrece. No declarar reparación remota antes de verificar.
