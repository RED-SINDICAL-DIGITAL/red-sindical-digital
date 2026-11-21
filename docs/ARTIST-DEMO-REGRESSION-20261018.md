# Perfiles y artistas: regresión de demo — 18/10/2026

## Resultado de esta ejecución
114 pruebas locales satisfactorias:
`node --test tests/artist-*.test.cjs tests/profile-artist-opening.test.cjs tests/presskit-render-print.test.mjs tests/presskit-public-loading.test.cjs tests/workspace-daily-tools.test.cjs`

Integraciones ejecutadas por separado con el Worker real importado y SQLite/D1 y KV aislados, todas satisfactorias:
- artist-profile-drafts.mjs: guardar/reabrir borrador privado, aislamiento público, conflictos de revisión, rechazo de revisión superada, aprobación actual, recuperación de cola y acceso revocado.
- artist-public-visibility.mjs: perfiles ocultos/suspendidos, separación de afiliación, catálogo público saneado, feed regional y catálogo privado Admin.
- artist-claim-lifecycle.mjs: rechazo del borrador, verificación del reclamo de artista existente, vinculación tras aprobación, denegación de otra cuenta y revocación de sesión/invitación.
- artist-inquiries-integration.mjs: consulta gratuita entregada al destinatario correcto, acceso privado, persistencia de estados, denegación de estados inválidos y protección de perfiles suspendidos.

Platform integration checks 39156318121 para commit 467ea612e534a13f0ce943a375b97bbd9c3381ab: success.

No se crearon cuentas remotas, publicaron artistas, enviaron mensajes ni modificaron permisos o pagos en esta ejecución.

## Condiciones para cerrar perfiles en la demo
| Circuito | Evidencia disponible | Pendiente real |
|---|---|---|
| Crear/reclamar y abrir artista propio | Pruebas de cliente, integración aislada y comprobaciones históricas de staging | Sesión actual del artista; no se afirma autenticación vigente |
| Editar y guardar | Autosave, conflictos, respuestas incompletas y borradores aislados | Guardar y reabrir desde la cuenta actual en staging |
| Publicar presentación | Integración de privacidad/moderación y carga pública | Publicar datos acordados, abrir como visitante y retirar sin perder borrador |
| Compartir e imprimir | Render, guardas, lifecycle de impresión y muestra visual | Enlace público del artista real, vista previa externa y PDF desde dispositivos |
| Consultas | Integración gratuita y controles de bandeja | Enviar consulta de prueba y verla/responder estado en sesión actual |
| Dos dispositivos | Integración previa de sincronización y cliente | Recorrido actual en dos equipos físicos, incluida revocación selectiva |

La coincidencia de resultados locales y CI reduce el riesgo de regresión; no certifica D1/KV remotos, concurrencia distribuida, WhatsApp, impresión física, móvil/tablet/TV ni todos los módulos de la plataforma.
No se declara listo para producción. Se conserva el plan de cierre de demo y los pagos reales quedan al final.
