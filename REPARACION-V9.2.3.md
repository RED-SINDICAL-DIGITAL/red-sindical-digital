# UADAV STREAM V9.2.3 — Estabilización de producción

## Qué se corrigió

- Se eliminó del cliente la espera de `/api/playback/youtube` y el intento de reproducir URLs temporales de Invidious como `<video>`.
- Se eliminaron por completo los textos/botones `Preparando reproducción segura…` y `Abrir fuente` del reproductor universal.
- YouTube reproduce de inmediato mediante `https://www.youtube.com/embed/...`; esto no consume la YouTube Data API. Invidious sigue siendo el primer proveedor de búsqueda/descubrimiento y YouTube API sigue sólo como último fallback del Worker.
- Se reemplazó `youtube-nocookie.com` en playback por `youtube.com` para evitar incompatibilidades de reproducción observadas en Brave.
- `app.html` queda como App Shell real y dueño de un solo audio global.
- Las vistas embebidas llaman al host same-origin de forma síncrona antes de usar `postMessage`, conservando mejor el gesto de usuario para `audio.play()` y apertura del player.
- El Home, al abrirse directamente, se monta automáticamente dentro del App Shell.
- Las tarjetas/perfiles de Radio del Home abren `radio.html`, no el overlay legado.
- Se corrigió la lógica de carátula de Radio: primero artwork real del tema, luego resolver de carátula, luego imagen/logo de emisora y finalmente `radio-fallback.svg`.
- Se agregó fallback gráfico local para carátulas bloqueadas por Tracking Prevention.
- El Service Worker V9.2.3 no tiene `fetch` handler: no puede interceptar HTML, JS, APIs, streams, Range requests ni proveedores externos. Al activarse borra cachés UADAV antiguas.
- El endpoint público de telemetría del Home cambia de `/api/metrics/event` a `/api/activity`; el Worker acepta ambos para compatibilidad. Un bloqueador del navegador ya no debe afectar el flujo principal.
- D1 y KV no se migran ni se limpian.

## Hallazgo de producción

El dominio `uadavstream.com.ar` está configurado como custom domain del GitHub Pages del repositorio `RED-SINDICAL-DIGITAL/red-sindical-digital` (archivo `CNAME`). Por lo tanto, el frontend público se actualiza desde GitHub Pages. El KV contiene datos y claves heredadas como `index_html` / `service_worker_js`, pero el Worker actual sólo usa `admin_html` como HTML servido directamente. Borrar KV completo no corrige el frontend y sí puede destruir datos reales.

## Deploy obligatorio

1. Subir **todo el contenido de esta carpeta** a la rama `main` del repositorio GitHub Pages. No subir solamente `worker.js`.
2. Reemplazar el Worker por `worker.js` V9.2.3 conservando bindings/secrets (`DB → uadavstream`, KV y secretos actuales).
3. Esperar a que GitHub Pages termine el deployment.
4. Abrir una vez `https://uadavstream.com.ar/reset-v923.html` para eliminar el Service Worker/caché técnica anterior del navegador.
5. Abrir `https://uadavstream.com.ar/diagnostico-v92.html` y comprobar:
   - Worker: `V9.2.3`
   - Player universal: `V9.2.3 · YouTube embed directo`
   - Service Worker: `V9.2.3 · sin interceptación fetch`
6. Abrir la portada. Debe quedar montada dentro de `/app.html?view=...`.

## Pruebas mínimas

- Home → tocar un video → el player abre inmediatamente sin `Preparando reproducción segura` ni `Abrir fuente`.
- Buscar → resultado de video → reproducir dentro de UADAV STREAM.
- Artistas → perfil → video → reproducción.
- Radio → tarjeta → debe abrir la interfaz nueva `radio.html`; play → pause → volumen → mute → perfil → cerrar.
- Con Radio sonando → navegar a Artistas/Cartelera → el audio sigue en el App Shell.
- Cartelera → evento → volver.

## No hacer

- No borrar el namespace KV completo.
- No recrear D1.
- No volver a copiar `service_worker_js` de KV sobre el archivo del repositorio GitHub Pages.
- No mezclar archivos V9.2.2 y V9.2.3.
