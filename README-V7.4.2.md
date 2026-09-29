# ★ UADAV STREAM V7.4.2 — Reparación integral

## Orden de despliegue
1. No cambies los bindings existentes: `DB -> uadavstream` y `UADAV_DB -> tu KV`.
2. En Cloudflare Worker, reemplazá el código por `worker.js` y desplegá.
3. Verificá `/api/health`: debe informar `V7.4.2`, `d1:true` y, si existe `YOUTUBE_API_KEY`, `youtube_api_enabled:true`.
4. Actualizá la clave KV `admin_html` con el nuevo `admin.html`.
5. Subí al hosting los HTML y assets nuevos (`uadav-design-v7.2.css`, `uadav-brand-v7.2.js`, `site-page-config.js`, `manifest.json`, `service-worker.js`).
6. Abrí Admin, iniciá sesión y recién entonces usá `Estado D1 / Inicializar D1`.
7. Si D1 todavía no tiene tablas, la Cartelera seguirá leyendo KV; no debe romperse.

## Política de búsqueda
- Cache KV primero cuando existe.
- Invidious siempre antes que la API oficial.
- YouTube API queda habilitada como último fallback si `YOUTUBE_API_KEY` existe.
- En prospección se usa YouTube oficial únicamente si Invidious entrega menos de 5 candidatos útiles.

## Reparaciones clave
- Worker: error de sintaxis `Unexpected token catch` corregido.
- Cartelera: fallback D1 -> KV tolerante a D1 sin inicializar.
- Admin: sin llamadas protegidas antes de iniciar sesión.
- Admin: sidebar real en columna propia, no superpuesto.
- Index: radio dock oculto hasta reproducir; cuando aparece es flotante y no queda al final de la página.
- Móvil: navegación y formularios adaptados, player por encima de navegación inferior.
- Assets faltantes restaurados.
