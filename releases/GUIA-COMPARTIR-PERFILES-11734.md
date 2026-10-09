# Compartir perfiles y Press Kit · frontend 12022 / Worker 11734

## Qué cambia

- Menú Compartir con WhatsApp, Copiar enlace y compartir del dispositivo cuando está disponible.
- El enlace contiene sólo el identificador público del artista. No contiene tokens de acceso, parámetros de gestión, ni la vista interna de app.html.
- Mi perfil presenta una ficha por artista vinculado: edición, herramientas, consultas y acceso público. Desvincular queda dentro de Vinculación del artista.
- Desde la gestión privada se puede compartir el perfil público. El Press Kit sólo se comparte después de publicar.

## Activar la imagen y descripción personalizadas

Reemplazar el código del Worker `uadav-api` por `worker-UADAVSTREAM-V11.7-11734.js`, conservando KV, D1 y los secretos existentes. No requiere migración manual ni nuevas claves.

La salud debe mostrar build `11734`. El frontend consulta `/api/public/share-link`. Si el Worker todavía es 11733, conserva el enlace público de siempre; no muestra una ruta que aún no existe.

El Worker genera HTML con Open Graph y Twitter Card antes de que se ejecute JavaScript. Usa nombre, biografía y foto públicos; si falta foto, usa la tarjeta institucional `assets/uadav-share-card.png`. El enlace abre después el perfil o Press Kit en la web.

Los enlaces generados usan el dominio del Worker. Para usar uadavstream.com.ar en estas rutas, se debe configurar una ruta Cloudflare que envíe `/share/*` a este Worker: publicar archivos estáticos no alcanza. No se modificó DNS ni rutas de Cloudflare.

`PUBLIC_SITE_URL` es opcional para marca blanca: URL HTTPS de la web pública. Por defecto se abre https://uadavstream.com.ar. No colocar el dominio del panel privado.

## Privacidad y comportamiento

- Perfiles ocultos y kits no publicados o deshabilitados devuelven 404.
- Se usa exclusivamente `public_json` para el Press Kit; nunca `data_json` ni el borrador privado.
- No se suben fotos del artista ni se hospedan videos; se referencian sus URLs públicas.
- La aplicación no envía WhatsApp automáticamente. El usuario abre WhatsApp y decide a quién enviar.
- WhatsApp puede conservar vistas previas anteriores. La presencia de etiquetas correctas no garantiza una actualización inmediata ni que el destinatario tenga activadas las vistas previas.
- El acceso público no requiere PRO; las herramientas privadas mantienen sus permisos actuales.

## Validación realizada

Pruebas del Worker y SQLite: HTML con metadatos, escape de texto, GET/HEAD, perfiles ocultos, kit sin publicar, exclusión de borradores y clientes, rechazo de métodos y enlaces sin secretos. Regresión de vinculación de cuenta, revocación de sesión, consultas, presentación y navegación.

El menú Compartir se prueba con datos ficticios en `/tests/artist-sharing-preview.html`. La tarjeta real en WhatsApp requiere desplegar el Worker y compartir desde un perfil público; no se enviaron mensajes durante la auditoría.
