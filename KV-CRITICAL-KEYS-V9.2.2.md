# KV crítico de frontend — V9.2.2

Sólo aplica si el Worker que sirve `uadavstream.com.ar` toma estos archivos desde KV.

- `index_html`  ← contenido completo de `index.html`
- `admin_html` ← contenido completo de `admin.html`
- `service_worker_js` ← contenido completo de `service-worker.js`

El resto de claves de datos (`artistas`, `radios`, `cartelera_*`, `secciones`, `web_visibility`, etc.) NO se toca.

Comprobación rápida después de sincronizar:

- `/diagnostico-v92.html` → Worker `V9.2.2`
- DevTools → Application → Service Workers → script `/service-worker.js?v=923`
- DevTools → Application → Cache Storage → `uadav-stream-v9-2-2`
