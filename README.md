# UADAVSTREAM — paquete consolidado

Paquete de trabajo consolidado para la versión audiovisual actual.

## Componentes principales

- `index.html` — Home / catálogo, Hero dinámico, búsqueda por tipo, radios, artistas, Live, TV/D-pad.
- `radio.html` — perfil completo de radio: vivo, ahora suena, historial, chat/pedidos, redes, compartir y apoyo.
- `artista.html` — perfil público cinematográfico del artista.
- `gestionar-artista.html` — espacio privado del artista mediante token.
- `sumate-artista.html` — alta pública de artista con términos previos.
- `bolsa-trabajo.html` — Bolsa de Trabajo con acceso/postulación para afiliados verificados.
- `contratar-artista.html` — contratación con aceptación previa de condiciones.
- `mi-uadavstream.html` — experiencia pública personalizada sin registro obligatorio + Premium por código.
- `admin.html` — Centro de Control Admin V28.14.
- `worker.js` — candidato Worker V6.4.2 con compatibilidad ampliada.
- `manifest.json` / `service-worker.js` — base PWA.

## Worker

`worker.js` es un candidato derivado de V6.4.1 con rutas explícitas adicionales para compatibilidad entre Index, Admin y las experiencias de artista/radio.

Bindings esperados:

- KV: `UADAV_DB`
- Secret/variable: `ADMIN_KEY`
- Variable opcional: `YOUTUBE_API_KEY`

El archivo `versions/worker-V6.4.1-stable.js` se conserva como referencia de la versión base estable anterior.

## Hospedaje

La interfaz puede alojarse como sitio estático. El Worker funciona como API y como punto de administración según la configuración actual del proyecto.

Las interfaces actuales apuntan al API configurado en:

`https://uadav-api.uadavstream.workers.dev/api/`

## Importante antes de producción

1. Probar el Worker candidato en Cloudflare antes de reemplazar V6.4.1.
2. Verificar las variables/bindings y permisos de KV.
3. Confirmar las páginas legales definitivas (`terminos.html` y `privacidad.html`) si se van a publicar los enlaces legales del footer.
4. Probar PC, móvil, Smart TV/TV Box, Admin, KV y reproducción de radios.

## Validación estática realizada

- JavaScript de las páginas principales: sintaxis válida.
- Worker: sintaxis válida.
- IDs HTML duplicados en páginas auditadas: ninguno detectado.
- Rutas internas principales del paquete: presentes.
