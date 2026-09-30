# ★ UADAV STREAM V8.2

V8.2 estabiliza el motor V8 y conserva el Admin visual aprobado.

## Principios
- D1 = registros estructurados.
- KV = configuración, compatibilidad y red de seguridad.
- Invidious = primera fuente externa de búsqueda/prospección.
- YouTube Data API = último fallback cuando Invidious no devuelve resultados.
- Ninguna falla de sincronización D1 debe impedir guardar primero en KV los flujos compatibles.
- Las publicaciones gratuitas de eventos salen automáticamente; solamente el destaque pago entra a revisión.

## Cambios principales
- Bootstrap D1 corregido: elimina el PRAGMA que producía `incomplete input` y crea las tablas una a una.
- Migración KV → D1 exige esquema listo antes de copiar.
- Radio, Bolsa, Artistas, Productoras, Eventos, Secciones y notificaciones toleran fallos de D1.
- API remota estable por defecto; `/api/` local queda opt-in hasta configurar una Route/Custom Domain real.
- Configuración de API centralizada en `uadav-api-config.js`.
- Prospección mejorada por rubro y canales; guardar prospecto ahora queda visible en Artistas → Prospectos.
- Importar canal crea un perfil completo oculto para revisión e incorpora contenido reciente.
- Exportación XLSX de perfiles completos: perfil + contenido + eventos; exportación separada de prospectos.
- Cartelera: slider premium “En foco”, filtros y ficha individual.
- Eventos: múltiples funciones, ticketera, precios, multimedia, contactos y ciclo de destaque.
- Hero: acciones distintas para Video / Evento / Artista / Radio / Live.
- Index: carga prioritaria del contenido esencial y diferimiento de descubrimiento; YouTube iframe API ya no se carga al inicio.
- Perfil de artista: fallback D1→KV robusto, identidad visual mejorada y reclamo de perfil corregido.
- Contenido universal y Colecciones para YouTube, Spotify, OK.ru, Drive, Vimeo, SoundCloud, Twitch, Kick y enlaces externos.
- Gestionar artista: corregida postulación a Bolsa desde el espacio privado.

## Archivos principales
- `worker.js`
- `admin.html`
- `index.html`
- `artistas.html`
- `artista.html`
- `cartelera.html`
- `evento.html`
- `publicar-evento.html`
- `radio.html`
- `bolsa-trabajo.html`
- `gestionar-artista.html`
- `uadav-api-config.js`

## Estado de email
El sistema puede trabajar con email OFF. No bloquea publicaciones ni administración. Cuando se configure Gmail/Apps Script se habilitará la entrega de notificaciones pendientes/nuevas.
