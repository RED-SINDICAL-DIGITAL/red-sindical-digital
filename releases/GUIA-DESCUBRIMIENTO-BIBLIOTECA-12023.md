# Descubrimiento y biblioteca · 12023

Los artistas buscados y los perfiles públicos abiertos se recuerdan en este dispositivo. Aparecen primero en el directorio y se incorporan al carrusel de inicio; Explorar incluye los descubrimientos recientes. Cuando un artista ya tiene perfil consolidado, se conserva ese perfil y sus datos oficiales de la plataforma.

La memoria local guarda hasta 80 fichas durante 7 días, sin videos, tokens ni datos privados. No crea perfiles permanentes por cada búsqueda. No se sincroniza entre dispositivos ni equivale a publicación global: la consolidación pública del servidor conserva sus controles de confianza e interés.

La biblioteca mantiene videos y playlists paginados e incorpora Álbumes y colecciones, clasificando playlists del canal por títulos que indican álbum/disco. Esa clasificación no constituye un catálogo discográfico completo: playlists privadas, lanzamientos distribuidos fuera del canal, videos retirados y restricciones regionales no se pueden garantizar. Todas las playlists continúan disponibles en su pestaña, aunque no se identifiquen como álbum.

No requiere un Worker nuevo. El 11734 sigue siendo la actualización pendiente para las vistas previas al compartir, si aún no fue desplegado.

Pruebas: memoria acotada y vencimiento, exclusión de fichas ocultas o de baja confianza, preferencia del perfil consolidado, ausencia de tokens y videos guardados; paginación y fallback de API de YouTube. Prueba visual aislada en tests/artist-library-preview.html.
