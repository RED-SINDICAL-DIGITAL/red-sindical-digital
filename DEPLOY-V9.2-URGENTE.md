# Deploy V9.2.2 — Reparación de reproducción en producción

## Qué corrige esta versión
- Invidious sigue siendo el primer resolvedor/buscador.
- Las URL directas entregadas por una instancia Invidious ya no pueden dejar el player negro indefinidamente: si el stream no llega a `canplay/loadeddata` en 4.5 s, UADAV STREAM cambia al reproductor embebido oficial de YouTube. Esto NO usa la YouTube Data API ni consume cuota.
- Las URL relativas de Invidious se normalizan en el Worker.
- El embed envía `origin`/`widget_referrer` y una política de referrer compatible con producción HTTPS.
- El App Shell delega autoplay/fullscreen/PiP al frame interno.
- Service Worker y todos los assets críticos cambian a `v=922` / cache `uadav-stream-v9-2-2`, para eliminar mezcla de archivos 9.2.0/9.2.1 en producción.

## Orden de deploy obligatorio
1. Desplegar `worker.js`.
2. Abrir `/api/health` y comprobar `version: V9.2.2`.
3. Publicar TODO el directorio estático, especialmente `app.html`, `index.html`, `uadav-content-player.js`, `uadav-shell-bridge.js`, `uadav-api-config.js` y `service-worker.js`.
4. Si el frontend de `uadavstream.com.ar` sirve archivos desde KV, actualizar también las claves de frontend. En la captura de producción existe `service_worker_js`: su contenido debe ser exactamente el `service-worker.js` de V9.2.2. Si se usan `index_html` y `admin_html`, sincronizarlos con `index.html` y `admin.html`.
5. No borrar ni recrear D1/KV de datos. Sólo se reemplazan archivos/código de frontend.
6. Purga de caché de Cloudflare para los archivos estáticos si hay una regla de cache delante del sitio.
7. Cerrar todas las pestañas de UADAV STREAM y volver a abrir. `index.html` fuerza desregistro de SW viejo cuando detecta `uadavstream-v922`.
8. Abrir `/diagnostico-v92.html`: Worker debe decir V9.2.2 y el Service Worker debe terminar en `/service-worker.js?v=922`.

## Sobre los mensajes de consola vistos en Brave
- `POST .../api/metrics/event net::ERR_BLOCKED_BY_CLIENT` es el bloqueo de métricas por el navegador/escudo. La llamada está encapsulada y NO controla reproducción.
- `Tracking Prevention blocked access to storage for i.pinimg.com` corresponde a un recurso de imagen externo. Tampoco controla reproducción.
- Si un video concreto prohíbe embed por decisión del propietario, UADAV STREAM no puede forzarlo; en ese caso permanece `Abrir fuente`.

## No tocar
- Binding D1 `DB -> uadavstream`.
- KV operativo y sus datos de artistas, radios, cartelera, etc.
- CCT / monetización / afiliación.
