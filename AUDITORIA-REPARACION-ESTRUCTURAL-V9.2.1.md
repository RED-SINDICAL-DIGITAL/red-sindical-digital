# ★ UADAV STREAM — Auditoría y reparación estructural V9.2.1

## Objetivo
Estabilizar V9 antes de continuar con la interfaz definitiva. Esta reparación no agrega módulos de negocio nuevos y no migra, vacía ni reemplaza KV/D1.

## Causas raíz encontradas

1. **Reproductores paralelos**: Home, Artista, Media y Shorts resolvían reproducción por caminos distintos. Un contenido podía funcionar en una vista y fallar en otra.
2. **App Shell sin propietario único del audio**: la vista Home intentaba leer/operar un `<audio>` local aunque, en modo Shell, la señal real debía vivir en `app.html`.
3. **Error en carátula/metadatos de radio**: `addRadioHistory()` utilizaba una variable `art` no definida al notificar al Shell. Ese `ReferenceError` podía cortar la actualización de portada/metadatos.
4. **Pausa confundida con cierre**: la pausa de radio eliminaba la fuente en algunos caminos, por lo que no existía una pausa/reanudación real.
5. **YouTube dependía demasiado del embed**: ante restricciones de embed aparecía “No se puede reproducir embebido” sin intentar antes una URL reproducible obtenida vía Invidious.
6. **Artistas recién publicados podían quedar pisados por D1**: la lectura pública fusionaba KV y D1 de forma que una copia D1 atrasada podía sobrescribir la versión más reciente de KV.
7. **Navegación no centralizada**: enlaces y acciones internas no siempre notificaban al App Shell.
8. **Service Worker insuficientemente defensivo**: ya evitaba varios recursos remotos, pero faltaba excluir de forma explícita Range Requests y más extensiones de streaming.
9. **Smart TV**: había estilos de foco, pero no navegación espacial global por flechas.
10. **Carátula de radio limitada**: algunos perfiles sólo tenían `portada`/`fondo`, mientras varias vistas buscaban únicamente `logo`/`imagen`.

## Reparación aplicada

### Reproducción universal
- `uadav-content-player.js` queda como motor único de contenido audiovisual.
- En App Shell, las vistas hijas envían `uadav:content-play` y el reproductor vive en el padre, por lo que no se destruye al cambiar de sección.
- YouTube: se consulta `/api/playback/youtube`; el Worker intenta Invidious primero para obtener un stream reproducible. Sólo si no es posible, se usa embed de respaldo.
- Soporte conservado para Spotify, Vimeo, SoundCloud, Drive, OK.ru y archivos directos.
- El reproductor puede minimizarse para continuar dentro de la navegación de UADAV STREAM.

### Radio
- `app.html` es el propietario del único **motor activo** de radio en modo Shell.
- Play, pause, resume, mute, volumen, cerrar y abrir perfil se sincronizan por mensajes.
- Volumen y mute persisten en `localStorage`.
- Emisora y metadatos persisten durante la sesión.
- Media Session se administra desde el Shell.
- Se corrigió la variable de artwork no definida.
- Se mejoró fallback de carátula: artwork del tema → logo → imagen → portada → fondo.
- Se amplió detección de hosts Zeno y resolución de metadata.
- Las vistas `index.html` y `radio.html` conservan motor local sólo como fallback cuando se abren fuera del Shell; dentro del Shell no cargan una segunda señal.

### Invidious / YouTube
- Búsqueda global: Invidious primero, caché KV, YouTube API sólo si está explícitamente habilitada y sólo como último fallback.
- Nuevo resolver de reproducción `/api/playback/youtube` con Invidious primero.
- El Service Worker no interviene en URLs externas, `/api/`, audio/video, Range Requests ni extensiones de streaming.

### Artistas
- Lectura pública corregida: D1 se toma como base y la versión actual de KV la sobrescribe, no al revés.
- `/api/public/artista` consulta primero el catálogo canónico KV y usa D1 como fallback.
- Se preservan los procesos actuales de publicación/sincronización; no se alteró el esquema D1 ni se borró KV.
- Se estabilizó el tamaño/alto de tarjetas del perfil para evitar placas deformadas.

### Navegación
- `uadav-shell-bridge.js` centraliza navegación interna cuando la vista está embebida.
- Se corrigió el enlace “Ver artistas” de `sumate-artista.html`.
- Se agregó el bridge compartido a páginas públicas que todavía podían navegar por fuera del Shell.
- Auditoría estática: **0 referencias internas a archivos inexistentes** y **0 IDs HTML duplicados**.

### Admin / visibilidad
Se preservó el control existente para mostrar/ocultar desde Admin: Hero, búsqueda, banners, continuar, mi lista, destacados, recomendados, explorar, En vivo, Radios, Artistas, Shorts, Bolsa, Cartelera, Cine & Historias, Playlists, Podcast, bloques institucionales, CTA, newsletter y footer.

### Smart TV / responsive
- Se conservan breakpoints existentes para móvil/tablet/PC.
- `uadav-ui-v8.4.js` incorpora navegación espacial por `ArrowLeft/Right/Up/Down` cuando se usa `?tv=1` / TV mode.
- El App Shell propaga `tv=1` a la vista interna.
- No se interceptan flechas dentro de inputs de texto/range/select.

## Validaciones realizadas en el paquete

- Sintaxis de todos los JS externos e inline: **OK**.
- Normalización del reproductor (YouTube URL, youtu.be, Invidious, ID directo, Spotify): **OK**.
- Referencias internas a HTML/JS/CSS/imágenes locales inexistentes: **0**.
- IDs HTML duplicados: **0**.
- Service Worker: bypass explícito de APIs/externos/streaming/Range verificado por código.
- Flujo de publicación: KV actualizado queda con precedencia pública sobre D1 atrasado.
- Visibilidad de secciones: claves solicitadas presentes en Admin y consumidas por Home.

### Limitación del entorno de prueba
Se intentó ejecutar Chromium headless contra un servidor local para hacer E2E real. El navegador del entorno bloquea `localhost/127.0.0.1` con `ERR_BLOCKED_BY_ADMINISTRATOR`, por lo que no es posible certificar aquí reproducción real de streams externos, autoplay, CORS del proveedor o comportamiento específico de cada Smart TV. Esos puntos requieren smoke test inmediato en el dominio Cloudflare una vez desplegado.

## Orden de despliegue recomendado

1. **Worker primero**: publicar `worker.js` V9.2.1 y confirmar `/api/health` = `V9.2.1`.
2. Publicar estáticos: `app.html`, `index.html`, `uadav-content-player.js`, `uadav-shell-bridge.js`, `uadav-ui-v8.4.js`, `service-worker.js`, `radio.html`, `artista.html`, `media.html`, `shorts.html` y el resto del paquete.
3. Invalidar/purgar caché de Cloudflare si corresponde.
4. Abrir el sitio una vez, recargar y confirmar que el Service Worker activo usa `uadav-stream-v9-2-1`.
5. Ejecutar el checklist operativo incluido.

## Criterio de estabilidad
No avanzar con V9 interfaz definitiva hasta completar en producción:

- crear/publicar artista → aparece → abrir → reproducir video;
- cartelera → destacado → evento → volver;
- radio → play → pause → volumen → mute → perfil → cerrar;
- buscar → resultado → reproducir;
- Home → navegación a todas las secciones;
- móvil/tablet/PC;
- Smart TV con `?tv=1`, foco y flechas.

> Nota sobre “segundo plano”: esta versión mantiene el reproductor dentro del **App Shell** al navegar por UADAV STREAM. La reproducción con la pestaña totalmente suspendida o con la pantalla del teléfono bloqueada depende de las políticas del navegador, del sistema operativo y del proveedor (especialmente YouTube) y no puede garantizarse desde una PWA web.
