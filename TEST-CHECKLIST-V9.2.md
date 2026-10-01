# ★ UADAV STREAM V9.2.1 — Smoke test obligatorio post-deploy

## 0. Infraestructura
- [ ] `/api/health` devuelve `V9.2.1`.
- [ ] `kv: true`.
- [ ] `d1: true`.
- [ ] `youtube_api_mode` coincide con configuración esperada.
- [ ] Admin abre sin 401 inesperado.
- [ ] Service Worker activo = `uadav-stream-v9-2-1`.

## 1. Artista
- [ ] Crear/postular artista de prueba.
- [ ] Aprobar/publicar desde Admin.
- [ ] Aparece inmediatamente en `/artistas.html` y Home.
- [ ] Abrir `/artista.html?id=...`.
- [ ] Reproducir video.
- [ ] Minimizar reproductor y navegar a otra sección: continúa en App Shell.

## 2. Cartelera
- [ ] Abrir `/cartelera.html`.
- [ ] Abrir destacado/Hero.
- [ ] Abrir evento.
- [ ] Volver a Cartelera.
- [ ] Repetir desde móvil.

## 3. Radio
- [ ] Play.
- [ ] Pause real (sin perder emisora).
- [ ] Resume.
- [ ] Cambiar volumen.
- [ ] Mute / unmute.
- [ ] Confirmar carátula/logo/portada.
- [ ] Abrir perfil de radio.
- [ ] Navegar y confirmar persistencia dentro del App Shell.
- [ ] Cerrar: recién aquí se elimina la fuente.

## 4. Búsqueda
- [ ] Buscar término con resultados.
- [ ] Confirmar artistas/radios/videos.
- [ ] Abrir video.
- [ ] Si Invidious entrega stream directo, reproduce sin iframe YouTube.
- [ ] Si no puede, verifica fallback de embed.

## 5. Home / Admin
- [ ] Hero institucional visible y rotación intacta.
- [ ] Desactivar y reactivar: Radio, Artistas, Shorts, Cartelera, Cine & Historias, Playlists y Podcast.
- [ ] Cada cambio se refleja en Home sin romper navegación.

## 6. Responsive
- [ ] 360–430 px móvil.
- [ ] 768–1024 px tablet.
- [ ] 1366/1440/1920 px PC.
- [ ] No hay tarjetas cortadas, solapadas ni scroll horizontal global accidental.

## 7. Smart TV
- [ ] Abrir `app.html?tv=1`.
- [ ] Flechas mueven foco entre elementos visibles.
- [ ] Enter activa enlaces/botones.
- [ ] Las flechas no interfieren al editar campos.
- [ ] Navegar Home → Artistas → perfil → volver.
- [ ] Navegar Home → Cartelera → evento → volver.
