# ★ UADAV STREAM V8.3 — Experiencia Multimedia

V8.3 consolida el motor V8.2 y agrega la siguiente capa de producto sin abandonar KV ni romper la compatibilidad con D1.

## Novedades principales

- Importación simple para seccionales/productoras: Nombre, Rubro, Ciudad, Provincia, País, Email, WhatsApp y Canal/URL opcional.
- Importación avanzada para Administración: artistas, productoras, radios, eventos, bolsa, contenido, playlists/podcast y películas/series.
- Perfil de artista con reproductor interno para YouTube, Spotify, Vimeo, SoundCloud, Drive, OK.ru y archivos directos compatibles.
- Tabs Playlists y Podcast en el perfil de artista.
- Exportación XLSX de perfil artístico ampliada: Perfiles, Contenido, Playlists, Podcast, Eventos y Fuentes.
- Radio con Chat separado de Pedidos de canciones, historial compartido en D1 y carátulas.
- Cartelera rediseñada: hero/slider ancho, destacados premium, filtros y grilla responsive.
- Catálogo Películas y Series con temporadas y episodios.
- Playlists y Podcast globales.
- Monetización v2: productos comerciales y campañas para artistas, eventos, radios y espacios de plataforma.
- App Shell (`app.html`) para conservar el audio de radio entre vistas cuando se usa la PWA/app.
- D1 V8.3 con auto-upgrade seguro de esquema y backup ampliado.

## Regla de búsqueda

Invidious sigue siendo prioritario. La API oficial de YouTube permanece habilitada únicamente como último fallback cuando Invidious no entrega resultados útiles.

## Arquitectura

- D1: registros estructurados.
- KV: configuración, compatibilidad y red de seguridad.
- Worker: API y automatización.
- Gemini: asistencia/clasificación controlada.
- PWA/App Shell: navegación pública con player de radio persistente.

## Publicación multimedia

UADAV STREAM administra metadatos, URLs y embeds. No aloja ni importa archivos audiovisuales de terceros sin autorización. Películas, series, música, podcasts y otros contenidos deben provenir de fuentes que permitan su publicación, enlace o reproducción embebida.
