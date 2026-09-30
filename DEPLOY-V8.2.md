# Despliegue seguro — ★ UADAV STREAM V8.2

## 1. No cambies bindings
Conservar:
- `DB` → D1 `uadavstream`
- `UADAV_DB` → KV actual
- `ADMIN_KEY` → secret actual
- `YOUTUBE_API_KEY` → puede permanecer configurada; sólo se usa como último fallback.

## 2. Primero: Worker
Desplegar `worker.js` V8.2.

Probar:
`https://uadav-api.uadavstream.workers.dev/api/health`

Debe responder `version: V8.2.0`, `kv:true`, `d1:true`.

## 3. D1
Entrar al Admin → D1, IA y automatización.

La pantalla de estado debe mostrar `ready:true` y tablas como `artists`, `events`, `radios`, `jobs`, `content_items`, etc.

Si sigue mostrando únicamente `_cf_KV`, usar una vez **Reparar / Inicializar D1**.

Después usar una vez **Migrar KV → D1**.
La migración no borra KV.

## 4. Admin
Reemplazar `admin.html` por el V8.2.
Probar: Radio, Bolsa, Eventos, Prospección, Artistas → Prospectos, Importar/exportar.

## 5. Público
Luego reemplazar `index.html`, `artista.html`, `artistas.html`, `cartelera.html`, `evento.html`, `publicar-evento.html`, `radio.html` y demás páginas.
Subir también `uadav-api-config.js`, `uadav-brand-v7.2.js`, `site-page-config.js`, `service-worker.js` y CSS.

## 6. Cache/PWA
El Service Worker usa cache `uadav-stream-v8-2` y elimina caches anteriores al activarse.
Si el navegador insiste con una versión vieja, cerrar todas las pestañas de UADAV STREAM y reabrir; en pruebas puede usarse ventana privada.

## 7. API de primer nivel (recomendado después de estabilizar)
Actualmente `uadav-api-config.js` apunta a `workers.dev` para no generar 404/405 falsos en `/api/`.
Cuando se configure `api.uadavstream.com.ar` como Custom Domain del Worker, cambiar SOLO:
`window.UADAV_API_BASE = 'https://api.uadavstream.com.ar/api/';`
Esto evita depender del hostname `workers.dev` en el frontend.
