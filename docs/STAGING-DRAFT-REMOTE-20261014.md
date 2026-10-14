# Borradores de perfil: revalidación real en Cloudflare

Fecha 2026-10-14. Solo uadav-stream-staging.pages.dev y uadav-api-staging.uadavstream.workers.dev. El usuario informó despliegue del Worker de borradores.

## API remota
PASS tests/staging-readonly-smoke.mjs.
PASS tests/staging-profile-drafts.mjs: crear cuenta y borrador de artista; obtener sesión; guardar borrador revisión 0; leer en petición nueva y recuperar revisión 1; perfil público devuelve 404; revisión desactualizada devuelve 409; enviar revisión 1 a moderación; lectura posterior conserva texto y estado pending revisión 2; el perfil continúa privado; desvincular el artista invalida el token emitido (401).
El test se ejecutó con Origin del frontend de pruebas. Rutas de cuenta devolvieron el origen explícito; rutas genéricas aceptan wildcard sin credenciales de cookies. La primera ejecución del test tenía una expectativa CORS demasiado estricta para la ruta pública de configuración y se corrigió antes de realizar escrituras.

Efectos: una cuenta y un artista sintéticos nuevos conservados, vínculo de esa prueba retirado y un elemento de moderación sintético pendiente. Sin pagos, publicación pública ni modificaciones a datos de producción.

## Navegador Chrome remoto
Se reutilizó la cuenta ficticia PRUEBA VISUAL y su artista QA 2235.
- Se abrió el editor desde Mi perfil sin enlace manual.
- Se guardó biografía ficticia con Guardar borrador; apareció Borrador guardado y el aviso de que aún no estaba publicado.
- Se salió a Mi cuenta y se reabrió el editor con una nueva carga: se recuperó exactamente el texto de la biografía y el estado Borrador guardado.
- Se pulsó Enviar a revisión: apareció En revisión y la confirmación Borrador guardado y enviado a revisión. Tu perfil sigue privado. Se capturó evidencia del texto recuperado, ambos botones y la confirmación.

## Pendiente
Aprobación/rechazo real desde Admin, recuperación ante interrupción de aprobación, publicación de artista nuevo, concurrencia entre escritores D1/KV, móvil/tablet/TV, perfil PRO y pagos simulados completos. No se declara terminada la plataforma.
La cuenta y el artista de Chrome siguen vinculados para continuar. Se observaron enlaces Ver perfil público en borradores todavía privados: pendiente simplificar esos accesos para evitar destinos vacíos.
