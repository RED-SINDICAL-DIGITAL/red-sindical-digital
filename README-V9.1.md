# ★ UADAV STREAM V9.1 — HOTFIX OPERATIVO

Objetivo de esta versión: recuperar reproducción, navegación y control de visibilidad sin cambiar la arquitectura D1/KV ni el modelo CCT de V9.

## Reparaciones principales

- Búsqueda YouTube/Invidious devuelve ahora `provider`, `external_id` y `url` reproducible.
- Contenido histórico sin URL se normaliza automáticamente si conserva un ID de YouTube.
- Nuevo endpoint Admin: `POST /api/admin/content/repair-links`.
- Perfil de artista reconstruye enlaces antiguos y reproduce YouTube/Spotify/Vimeo/SoundCloud/Drive/OK.ru cuando el proveedor permite embed.
- Playlists y Podcast reproducen dentro de UADAV STREAM en lugar de abrir siempre una pestaña externa.
- Service Worker V9.1 no intercepta APIs externas, streams, audio o video.
- Se restauraron todos los assets compartidos que faltaban en el paquete V9.0.
- Hero institucional “El arte escénico al alcance de todos” vuelve a formar parte de la rotación por defecto y puede ocultarse desde Admin.
- Admin Home permite mostrar/ocultar Radio, Cine & Historias, Playlists, Podcast, Shorts, Cartelera y demás módulos.
- Podcast y Playlists tienen acceso explícito en el menú del Admin.

## Regla de reproducción

- Invidious: descubrimiento/búsqueda prioritaria.
- YouTube oficial: último fallback para búsqueda cuando esté habilitado.
- Playback YouTube: embed oficial `youtube-nocookie.com`.
- Nunca hospedamos/copiamo el archivo audiovisual de YouTube.

