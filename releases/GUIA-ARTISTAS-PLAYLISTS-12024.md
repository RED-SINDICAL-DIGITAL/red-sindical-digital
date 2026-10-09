# Artistas y playlists · 12024

- Categorías horizontales sin cortar palabras en móvil, tablet y escritorio.
- Biblioteca: «Colecciones» identifica posibles álbumes por título explícito, excluyendo mixes, favoritos y discografías. Sigue siendo una playlist del canal, no un álbum certificado. No se garantiza catálogo completo de YouTube Music.
- Caché pública de páginas del canal: cinco minutos; solicitudes repetidas se comparten. La caché no almacena datos privados.
- Playlists en el player de app.html: integración oficial de YouTube IFrame API, Anterior/Siguiente y enlace externo. Errores 100/101/150 avanzan al siguiente video; último tema, fallo repetido o diez omisiones consecutivas detienen la recuperación para evitar bucles. Errores de configuración/red no se omiten automáticamente.
- Bloqueo de autoplay: indicación para tocar reproducir. Sin API adicional, se conservan los controles originales y el enlace externo.
- No cambia permisos PRO, contenido editado, consultas ni Worker. Descubrimientos recientes siguen siendo locales al navegador.

Validación: tests/playlist-recovery.mjs, tests/artist-discovery-experience.mjs, tests/youtube-library.mjs y tests/admin-navigation.mjs. Las omisiones se verifican con eventos simulados; requieren prueba de reproducción real del usuario en dispositivo.
