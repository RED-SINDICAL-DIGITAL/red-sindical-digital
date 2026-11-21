# Imágenes alternativas de entidades — 2026-11-04
Staging. Las tarjetas de entidades seleccionan la primera imagen HTTPS válida, aunque un campo anterior no vacío contenga un esquema inválido o credenciales. Conservan prioridad de foto y el fallback visual de inicial. No cambia privacidad, publicación ni destinos.
849 pruebas aprobadas, cero fallos. Nueva regresión cubre esquema inseguro, alternativa válida, prioridad y rechazo de credenciales. Referencias de caché actualizadas en portada y Admin.
Sin cambios de Worker ni producción.
