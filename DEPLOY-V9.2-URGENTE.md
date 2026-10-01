# UADAV STREAM V9.2 — despliegue urgente

No mezclar archivos V9.0/V9.1/V9.2.

## Reemplazar primero
1. `worker.js`
2. `service-worker.js`
3. `uadav-content-player.js`
4. `uadav-api-config.js`
5. `uadav-shell-bridge.js`
6. `index.html`
7. `artista.html`
8. `radio.html`
9. `app.html`
10. `cartelera.html`
11. `evento.html`
12. `playlists.html`
13. `podcasts.html`

Luego subir el resto de la carpeta para mantener todas las páginas en la misma versión.

## Verificación
- `/api/health` debe indicar `V9.2.0`.
- abrir `/diagnostico-v92.html`.
- cerrar todas las pestañas antiguas de UADAV STREAM y abrir de nuevo.
- `Ctrl+F5` una vez.

## Pruebas obligatorias
1. Artista → tocar video → debe aparecer iframe `youtube-nocookie.com`.
2. Home → tocar evento → debe entrar a `evento.html?id=...`.
3. Cartelera → tocar placa → debe entrar al evento.
4. Radio → Play/Pausa, volumen, mute, Ver radio y X.
5. Buscar un video → tocar resultado → debe reproducir dentro de UADAV STREAM.
