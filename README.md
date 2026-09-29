# UADAVSTREAM — paquete consolidado

Paquete de trabajo consolidado para la versión audiovisual actual, con ronda de reparación integral.

## Componentes principales

- `index.html` — Home / catálogo, Hero dinámico, búsqueda por tipo, radios, artistas, Live, TV/D-pad.
- `radio.html` — perfil completo de radio: vivo, ahora suena, historial, chat/pedidos, redes, compartir y apoyo.
- `artista.html` — perfil público cinematográfico del artista.
- `gestionar-artista.html` — espacio privado del artista mediante token.
- `sumate-artista.html` — alta pública de artista con términos previos.
- `bolsa-trabajo.html` — Bolsa de Trabajo con acceso/postulación para afiliados verificados.
- `contratar-artista.html` — contratación con aceptación previa de condiciones.
- `mi-uadavstream.html` — experiencia pública personalizada sin registro obligatorio + Premium por código.
- `publicar-evento.html` — alta pública de eventos con solicitud opcional de destacado y posterior confirmación manual.
- `terminos.html` / `privacidad.html` — páginas legales editables desde Admin.
- `site-page-config.js` — aplica configuración editable a las páginas públicas.
- `admin.html` — Centro de Control Admin V28.15.
- `worker.js` — Worker V6.4.3 candidato con compatibilidad ampliada y sincronización de artistas/eventos/bolsa.
- `manifest.json` / `service-worker.js` — base PWA, caché V31.11.

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

## Reparaciones incluidas en esta ronda

- Radio: `metadata_url`/Zeno, carátulas desde metadata/Deezer, reproductor profesional, volumen, mute y ecualizador visual.
- Index: player de radio persistente, navegación Live/Artistas/Cartelera corregida, búsqueda en modo catálogo con filtros y contador por tipo, Hero de eventos destacados.
- Artistas: API pública canónica y sincronización `secciones` → `artistas`; endpoint de prospectos explícito.
- Admin: acceso cerrado hasta autenticar, sesión no persistida en `localStorage`, layout lateral con espacio real para contenido, `u28Write` expuesto correctamente, páginas públicas editables, gestión de eventos/destacados y bolsa.
- Eventos: formulario público, aprobación, cartelera y destacado pago confirmado manualmente.
- Bolsa: publicación pública de oportunidades; gestión administrativa; postulación restringida a artistas afiliados verificados.
- Legales: `terminos.html` y `privacidad.html`, editables desde Admin.

## Importante antes de producción

1. Probar el Worker candidato en Cloudflare antes de reemplazar V6.4.1.
2. Verificar las variables/bindings y permisos de KV.
3. Confirmar las páginas legales definitivas (`terminos.html` y `privacidad.html`) si se van a publicar los enlaces legales del footer.
4. Probar PC, móvil, Smart TV/TV Box, Admin, KV y reproducción de radios.
5. Confirmar el circuito real de cobro para eventos destacados antes de automatizar pagos.
6. Revisar legalmente los textos de Términos y Privacidad antes de publicarlos como versión definitiva.
7. Reemplazar V6.4.1 solo después de validar V6.4.3-candidate en Cloudflare.

## Validación estática realizada

- JavaScript de las páginas principales: sintaxis válida.
- Worker: sintaxis válida.
- IDs HTML duplicados en páginas auditadas: ninguno detectado.
- Rutas internas principales del paquete: presentes.
