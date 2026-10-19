# Cierre parcial de concurrencia D1 real — 16/10/2026

## Entorno y alcance

API exclusiva https://uadav-api-staging.uadavstream.workers.dev/api/. Scripts rechazan producción. No se desplegó Worker, fusionó main, activó cobro ni publicaron artistas. Usaron credenciales sintéticas generadas en memoria, sin registrarlas.

## Pruebas remotas ejecutadas

| Circuito | Resultado real |
| --- | --- |
| Cuenta | Crear/leer/guardar; revisión obsoleta 409; dos PUT simultáneos con revisión 2 devolvieron exactamente 200 y 409; lectura posterior conservó al ganador en revisión 3 |
| Recuperación de cuenta | Relectura y combinación explícita de ambos favoritos ficticios; nuevo PUT aceptado; revisión 4 con ambos contenidos |
| Borrador de artista | Crear perfil privado; guardar/reabrir; revisión obsoleta 409; dos guardados simultáneos desde revisión 1 devolvieron 200 y 409; ganador persistió en revisión 2 |
| Revisión de contenido | Envío desde revisión 2 devolvió 202; borrador pendiente persistió en revisión 3; perfil público siguió devolviendo 404 |
| Revocación | Desvinculación únicamente del artista/cuenta sintéticos; acceso privado previo respondió 401 |
| CORS | Respuestas de cuenta mantienen origen exacto del frontend de staging |

Comandos ejecutados con UADAV_STAGING_API:

- node tests/staging-account-integration.mjs — PASS.
- node tests/staging-profile-drafts.mjs — PASS.
- node --check de ambos scripts — PASS.

Efectos: dos cuentas sintéticas retenidas, un perfil privado sintético retenido, una solicitud de contenido en moderación; un vínculo ficticio eliminado para comprobar revocación. No se borraron datos preexistentes. Pruebas no ejecutadas automáticamente en CI: requieren staging real.

## Qué queda abierto

Este resultado cierra la evidencia remota de comparación de revisiones para cuentas y borradores, no la concurrencia global de todos los módulos. La combinación de cuenta fue explícita dentro del test, no certificación visual del cliente automático en dos dispositivos físicos.

Continúa pendiente publicación D1/KV, escritores de catálogo concurrentes, vencimiento de leases y recuperación tras interrupción de publicación. También sigue pendiente observar la consulta ya creada desde la bandeja privada del artista existente; la recepción en Admin y sus cambios de estado sí están comprobados. No presentar el circuito integral como terminado.
