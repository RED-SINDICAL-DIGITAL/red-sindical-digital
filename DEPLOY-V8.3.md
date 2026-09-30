# Despliegue recomendado V8.3

1. Hacer copia del Worker V8.2 actual y del sitio público.
2. Desplegar `worker.js` V8.3.
3. Abrir `/api/health` y confirmar `version: V8.3.0`, `kv: true`, `d1: true`.
4. En Admin > D1, IA y automatización, pulsar `Reparar / inicializar D1` una vez. V8.3 también detecta automáticamente si falta el esquema nuevo.
5. Verificar que aparezcan, entre otras: `radio_tracks`, `radio_requests`, `media_titles`, `media_seasons`, `media_episodes`, `monetization_products`, `monetization_campaigns`.
6. Reemplazar `admin.html` y probar Importar/exportar, Radio, Películas/Series y Monetización.
7. Publicar `artista.html`, `radio.html`, `cartelera.html`, `peliculas-series.html`, `media.html`, `playlists.html`, `podcasts.html`.
8. Publicar `app.html`, `uadav-shell-bridge.js`, `manifest.json` y `service-worker.js`.
9. Publicar `index.html` al final, una vez comprobadas las páginas anteriores.

## No cambiar
- Binding D1: `DB -> uadavstream`.
- Binding KV: `UADAV_DB ->` namespace actual.
- Invidious como proveedor prioritario.

## Player persistente
La reproducción sin cortes entre páginas se garantiza al entrar mediante `app.html` o instalar la PWA, porque el `<audio>` vive fuera de las vistas. En navegación HTML directa tradicional puede existir un corte al abandonar la página.
