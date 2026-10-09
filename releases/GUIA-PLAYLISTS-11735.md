# Playlists · frontend 12025 / Worker 11735

La recuperación anterior dependía de getPlaylist() del player. Si este no entregaba sus temas, Anterior/Siguiente no tenían un destino válido. Se incorpora una cola independiente y paginada de metadatos públicos; cada tema se reproduce con loadVideoById. No se aloja audio ni se evaden restricciones de YouTube.

## Despliegue necesario

1. En Cloudflare, abrir el Worker uadav-api y Editar código.
2. Reemplazar el código por releases/worker-UADAVSTREAM-V11.7-11735.js y desplegar.
3. Mantener bindings, variables y secretos existentes: no hacen falta claves nuevas.
4. Consultar el endpoint de salud: debe indicar build 11735.
5. Recargar UADAV STREAM y abrir la playlist. El frontend usa build 12025.

Sin Worker 11735, hay compatibilidad con la lista interna de YouTube cuando este la entrega; si está vacía, se ofrece reintentar o abrir YouTube. No se declara arreglado el caso real antes del despliegue y la prueba.

## Comportamiento

- Lista visible de temas, selección individual, Anterior/Siguiente y más páginas.
- Endpoint GET /api/youtube/playlist_items?id=ID&cursor=CURSOR. Fuentes Invidious primero, API oficial como respaldo cuando está habilitada; caché KV de diez minutos y cursor ligado a playlist/proveedor.
- La API oficial consulta embeddable. Los temas que no permiten incrustación se identifican como externos y se omiten, conservando el enlace a YouTube.
- Errores 100/101/150 marcan el tema fallido y buscan el siguiente, incluyendo páginas posteriores. No se repite un tema fallido ni se reinicia la lista al final.
- No todos los bloqueos pueden anticiparse: región, edad, restricciones del propietario y disponibilidad pueden cambiar. No se afirma que YouTube haya eliminado el video por el solo hecho de fallar en la web.
- Si falla la consulta se conserva lo cargado y se ofrece reintentar. Al cerrar o cambiar de contenido se cancelan solicitudes y se ignoran eventos anteriores.

## Validación

tests/playlist-queue.mjs verifica cola independiente, omisiones, paginación, errores tardíos, fin sin bucles, reintentos y cancelación. Verifica también endpoint, privacidad, hosts permitidos, caché, cursor y API deshabilitada. Pasaron pruebas de biblioteca, navegación y vistas previas al compartir. La vista tests/playlist-queue-preview.html usa datos ficticios y el módulo real, sin reproducción real.
