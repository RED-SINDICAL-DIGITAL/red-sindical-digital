# ★ UADAV STREAM V8.4 — Interfaz + Control Total

V8.4 consolida la experiencia pública y administrativa sobre el motor D1 + KV.

## Principios
- D1: registros estructurados.
- KV: configuración, caché y fallback.
- Invidious: proveedor prioritario de descubrimiento/metadata YouTube.
- YouTube Data API: habilitada pero usada como último fallback.
- Gemini: asistencia de clasificación/enriquecimiento, nunca decisiones sensibles.
- No se alojan videos/audio externos: se guardan metadata, IDs, URLs y embeds compatibles.

## Cambios principales
- Importación simple para seccionales y productoras.
- Importación completa multihoja: Artistas, Productoras, Radios, Eventos, Bolsa, Contenido, Playlists, Podcast, Películas/Series, Temporadas, Episodios, Colecciones y Secciones.
- Plantillas XLSX listas para usar.
- Exportación de perfiles completos con hojas Perfiles, Contenido, Playlists, Podcast, Eventos, Fuentes y Calidad.
- Profundidad de enriquecimiento de canal hasta 200 contenidos por operación.
- Herramienta de reparación de identidad para prospectos antiguos creados desde títulos de video.
- Navegación pública simplificada: Inicio, Explorar, Artistas, Radio, Cartelera, Cine & Series, En vivo, Más.
- Radios del Home rediseñadas en formato musical moderno + Quick View.
- Perfil de radio: player custom, volumen, mute, stop, historial compartido, Pedidos separado de Chat y portada sin mosaico.
- Player global persistente mediante app.html/PWA.
- Perfil artista: reproducción interna, Playlists, Podcast, Clips, Eventos y navegación con mouse/touch/TV.
- Cartelera: hero/slider comercial, destacados y agenda; toda la placa destacada es clickeable.
- Evento: ficha comercial, CTA móvil persistente y eventos relacionados.
- Shorts: experiencia vertical scroll-snap tipo Reels/TikTok.
- Manual operativo completo en manual.html y dentro del Admin.
- Monetización separada de inventario publicitario: Producto = qué se vende; Campaña = compra concreta.

## Catálogo completo de YouTube/Spotify
No se recomienda copiar miles de ítems de cada canal a D1 sin necesidad. El modo recomendado es:
1. guardar el canal/fuente oficial;
2. importar 24/50/100/200 contenidos recientes según necesidad;
3. guardar playlists;
4. consultar/enriquecer bajo demanda;
5. mantener en D1 solo metadata/URLs, nunca archivos pesados.

Esto conserva cuota, velocidad y espacio. Un perfil completo se puede exportar sin necesidad de duplicar físicamente los videos.
