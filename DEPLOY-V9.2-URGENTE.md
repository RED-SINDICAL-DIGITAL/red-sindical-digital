# Deploy V9.2.1 — Reparación estructural

1. Desplegar `worker.js`.
2. Verificar `/api/health`: `V9.2.1`, KV y D1 activos.
3. Desplegar **todo el directorio estático**, no sólo `index.html`.
4. Purga de caché de Cloudflare si la configuración la requiere.
5. Recargar dos veces el sitio para reemplazar Service Worker anterior.
6. Ejecutar `TEST-CHECKLIST-V9.2.md` completo.

Archivos críticos que deben viajar juntos:
- `app.html`
- `index.html`
- `uadav-content-player.js`
- `uadav-shell-bridge.js`
- `uadav-ui-v8.4.js` + CSS
- `service-worker.js`
- `radio.html`
- `artista.html`
- `media.html`
- `shorts.html`
- `worker.js`

No migrar ni limpiar KV/D1 para este deploy.
