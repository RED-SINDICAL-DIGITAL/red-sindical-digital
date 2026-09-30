# Despliegue V9.1

1. Reemplazar `worker.js` y desplegar.
2. Verificar `/api/health`: debe indicar `V9.1.0`.
3. Subir TODOS los assets compartidos de este paquete: `uadav-api-config.js`, `uadav-shell-bridge.js`, `uadav-ui-v8.4.css`, `uadav-ui-v8.4.js`, `site-page-config.js`, `uadav-design-v7.2.css`, `uadav-brand-v7.2.js`, `uadav-v9.css`, `uadav-content-player.js`, `manifest.json`, `service-worker.js`.
4. Reemplazar `admin.html`, `index.html`, `artista.html`, `playlists.html`, `podcasts.html` y el resto de HTML del paquete.
5. Abrir Admin → Inicio / Home. Activar Hero, Radio, Cine & Historias, Playlists y Podcast. O pulsar `Mostrar todas`, luego `Guardar cambios`.
6. Abrir Admin → Biblioteca / Shorts y pulsar `Reparar reproducción` una sola vez. Esto normaliza contenido histórico sin URL/provider.
7. Recargar el sitio con Ctrl+F5. V9.1 registra `service-worker.js?v=91` y elimina caches del SW anterior.

No crear otra D1. Conservar `DB → uadavstream` y el KV actual.
