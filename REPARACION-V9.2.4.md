# UADAV STREAM V9.2.4 — Desktop Playback

- GitHub Pages no era el bloqueo: V9.2.3 fue desplegada correctamente.
- Se agrega reproducción adaptativa para Brave/desktop.
- Invidious comienza a resolverse inmediatamente y en paralelo.
- Si una instancia responde rápido, se usa su embed con `local=true`.
- Si no, se intenta YouTube IFrame API con `origin` + Referer.
- Si YouTube falla, devuelve error 153/101/150, la API se bloquea o vence el timeout, se conmuta automáticamente a Invidious.
- No aparece `Abrir fuente` ni `Preparando reproducción segura`.
- El resolver Invidious del Worker ahora prueba instancias en paralelo (timeout 2,6 s), no en serie.
- Radio se abre con `radio.html?v=924` para impedir que un HTML viejo quede retenido en el navegador/CDN.
- Service Worker continúa sin interceptar `fetch`.
- No borrar KV ni D1.
