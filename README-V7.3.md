# ★ UADAV STREAM V7.4

## Qué agrega esta versión

### Identidad
- El área pública se llama **Mi perfil**.
- La marca visible queda como **★ UADAV STREAM**.
- Se mantiene compatibilidad con `mi-uadavstream.html`, que redirige a `mi-perfil.html`.

### Cartelera
- `cartelera.html`: agenda completa con búsqueda, fechas, categorías, ciudad, país, gratis/con entradas y destacados.
- `evento.html`: ficha individual.
- Los eventos gratuitos pueden publicarse automáticamente.
- Los que solicitan destaque pasan a revisión.
- El destaque pagado puede ocupar espacios premium del Home.

### Prospección
- Admin: **Buscar artistas de Argentina**.
- Rubros: solistas, bandas/grupos, circo, teatro, danza, magia, humor, compañías, salas, productoras, creadores/YouTubers y otros.
- Los resultados son candidatos, no perfiles publicados automáticamente.
- El Admin puede definir restricciones por término, canal, artista o URL/dominio.

### D1
- Endpoint protegido para inicializar el esquema después de enlazar `DB`.
- Estado D1 desde Admin.
- Migración incremental `0002_cartelera_prospeccion.sql`.

## Regla principal

La IA puede clasificar, normalizar y proponer. La publicación, afiliación, destaque y decisiones sensibles siguen bajo control humano de UADAV STREAM.

## V7.4 - Invidious permanente
Invidious no se elimina del flujo. Se usa como proveedor suplementario/fallback para búsqueda global, prospección y resolución de canales. Instancias configuradas: inv.nadeko.net, invidious.nerdvpn.de, yt.chocolatemoo53.com, invidious.tiekoetter.com y yewtu.be. El Worker incluye diagnóstico administrativo `/api/admin/invidious/health`.

## Automatización
Make no forma parte de la arquitectura. La cola de notificaciones usa D1 + Cron/Queues cuando estén configurados y el correo se puede enviar mediante Google Apps Script.
