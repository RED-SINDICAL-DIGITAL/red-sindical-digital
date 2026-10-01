# ★ UADAV STREAM V9.2.2 — Smoke test post-deploy

## Infraestructura
- [ ] `/api/health` devuelve `V9.2.2`.
- [ ] `kv: true` y `d1: true`.
- [ ] `/diagnostico-v92.html` muestra Player universal OK.
- [ ] Service Worker activo termina en `service-worker.js?v=923`.
- [ ] Cache activa = `uadav-stream-v9-2-2`.

## Reproducción
- [ ] Home → video → reproduce.
- [ ] Buscar → resultado YouTube → reproduce.
- [ ] Artista → video → reproduce.
- [ ] Si Invidious entrega stream directo pero el navegador no lo puede cargar, en ~4.5 s aparece automáticamente el embed oficial.
- [ ] Probar al menos 3 videos distintos para descartar uno con embed deshabilitado por el propietario.
- [ ] Minimizar y navegar dentro de App Shell: el reproductor persiste.

## Cartelera
- [ ] Cartelera → destacado → evento → volver.

## Radio
- [ ] Play → pause → resume.
- [ ] Volumen → mute.
- [ ] Carátula/logo visible.
- [ ] Perfil → volver.
- [ ] Cerrar elimina la fuente.

## Responsive / TV
- [ ] 360–430 móvil.
- [ ] 768–1024 tablet.
- [ ] PC.
- [ ] Smart TV `app.html?tv=1`: foco con flechas y Enter.
