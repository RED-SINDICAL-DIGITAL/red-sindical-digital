# ★ UADAV STREAM V8.1

Motor consolidado sobre Cloudflare Worker + KV + D1, manteniendo el Admin V8 aprobado.

## Reglas del núcleo
- KV continúa como configuración, compatibilidad y red de seguridad.
- D1 organiza los registros y se auto-inicializa si faltan tablas.
- Una falla de sincronización D1 no debe impedir el guardado principal en KV.
- Búsqueda/descubrimiento: cache → Invidious → YouTube API oficial como último fallback.
- La IA ayuda a clasificar y analizar; no aprueba afiliaciones, pagos ni sanciones automáticamente.

## V8.1 incluye
- Radio y Bolsa con sincronización D1 tolerante a fallos.
- Cartelera completa y evento individual.
- Evento gratuito: publicación automática.
- Destaque pago: revisión/activación administrativa.
- Hero con comportamiento distinto para video, evento, artista, radio y Live.
- Eventos con destaque pago pueden incorporarse automáticamente al Hero.
- Biblioteca universal de contenido: YouTube, Spotify, OK.ru, Drive, Vimeo, SoundCloud, Twitch, Kick y URL genérica.
- Colecciones.
- Secciones del Home manuales, automáticas e híbridas, con colección base opcional.
- Prospección ampliada para música, bandas, artes escénicas, locución, salas, productoras y creadores.
- Restricciones de búsqueda.
- Importación Excel/CSV/JSON de artistas, productoras, radios, eventos, Bolsa y contenidos/playlists.
- Exportación XLSX/CSV/JSON.
- Centro de pendientes.
- Mantenimiento automático/manual de destacados y oportunidades vencidas.
- Responsive móvil en Admin, Index, Cartelera, Evento y Radio.

## Archivos principales
- worker.js
- admin.html
- index.html
- cartelera.html
- evento.html
- publicar-evento.html
- radio.html
- artista.html
- artistas.html
- bolsa-trabajo.html
- gestionar-artista.html
- contratar-artista.html
- sumate-artista.html
- mi-perfil.html

Ver DEPLOY-V8.1.md antes de subir.
