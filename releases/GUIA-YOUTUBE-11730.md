# YouTube público y perfiles · Worker 11730

1. Cloudflare → Workers → uadav-api → Edit code.
2. Reemplazar el código por worker-UADAVSTREAM-V11.7-11730.js y desplegar.
3. Mantener KV, D1, YOUTUBE_API_KEY y las variables existentes. No copiar claves al frontend.
4. Comprobar /api/health: build 11730.
5. Admin → Artistas y perfiles → Editar artista.
6. Pegar URL del canal de YouTube, @usuario o ID UC… → Consultar YouTube.
7. Elegir Vincular canal o Completar nombre, foto y biografía (también importa portada si está disponible).
8. Mostrar automáticamente → Guardar artista.
9. Perfil público → Videos → Ver más videos. Playlists se consulta al abrir la pestaña y tiene su propia paginación.

Perfil, canal y contenido público no requieren PRO. PRO y afiliación se gestionan por separado.

Invidious se conserva para videos/playlists; la API oficial funciona como respaldo cuando está habilitada. Los @usuarios se resuelven mediante la API oficial cuando no hay un ID de canal guardado. Se guardan páginas temporales en KV: URLs, títulos y miniaturas; no se alojan videos ni audios.

Los datos importados no se guardan en el artista hasta pulsar Guardar. Ocultar contenido automático conserva los enlaces cargados manualmente. La consulta no copia la discografía de YouTube Music ni garantiza álbumes. La primera página puede fallar si ambas fuentes no están disponibles; permite reintentar sin borrar lo que ya se ve.

Radio dentro de app.html usa un único reproductor persistente. La ficha muestra la canción actual; los controles de audio internos se reservan para radio.html abierto por separado.
