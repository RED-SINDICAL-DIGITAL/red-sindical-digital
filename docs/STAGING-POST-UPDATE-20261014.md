# Revalidación remota tras actualización manual de staging — 2026-10-14

## Entorno
API exclusiva: https://uadav-api-staging.uadavstream.workers.dev/api/
Actualización manual informada por el usuario antes de esta ejecución.
Entrega solicitada: cbeddcd5ca50ddcfc1ccdf5d25f45a9da1bf0432; Worker blob 6876e049660193efba82ac9266186230eadb50a9.
No se leyó el código desplegado ni el identificador de versión de Cloudflare; los resultados comprueban comportamiento, no identidad binaria del despliegue.

## Resultados reales
| Ejecución | Resultado |
| --- | --- |
| staging-readonly-smoke.mjs ampliado | PASS: salud, D1/KV disponibles, inscripción cerrada, rutas privadas y claves genéricas desconocidas rechazadas anónimamente |
| staging-account-integration.mjs | PASS: crear, leer, guardar, conflicto de revisión obsoleta 409 y estado persistido |
| staging-device-integration.mjs | PASS: cliente real de sincronización ejecutado en dos contextos VM, solicitud/aprobación, credenciales independientes, sincronización bidireccional, concesiones persistentes, revocación y preservación local |
| staging-artist-integration.mjs | PASS: borrador sin YouTube, enlace automático a cuenta, deduplicación, sesión privada, permisos FREE, Press Kit no publicado, denegación de artista no vinculado e invalidación de sesión emitida al desvincular |

## Efectos de las pruebas
Se crearon tres cuentas sintéticas y un borrador de artista sintético. La prueba de dispositivos revocó únicamente su dispositivo ficticio. La prueba de artista eliminó únicamente su propio vínculo de cuenta, conservando los registros sintéticos. No se borraron datos existentes. No se registraron credenciales ni se usaron datos personales reales.
Se confirmó que los pagos reales estaban deshabilitados. No se aprobaron reclamos ni se activaron productos PRO.

## Interpretación
El rechazo de claves genéricas desconocidas coincide con la corrección de acceso por defecto denegado. No demuestra que cada endpoint del sistema sea privado correctamente.
Los contextos VM no son navegadores físicos; estas pruebas no prueban CSS, QR mediante cámara, permisos del navegador ni experiencia en teléfonos o Smart TV.
No se publicó frontend aislado. No se comprobaron frontend nuevo + Worker nuevo juntos, reproducción de streams, notificaciones Push, confirmación bancaria real ni moderación IA.
El código de producción y su despliegue permanecieron sin cambios.

## Siguiente etapa
Preparar frontend aislado con eliminación de destinos de API de producción, indicador de pruebas y bloqueo de indexación; comprobar navegación, formularios y edición entre dos navegadores antes de proponer producción.
