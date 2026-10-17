# Pendientes → consulta seleccionada — 17/10/2026

Antes, Revisar en una tarjeta de contratación sólo navegaba a la bandeja de consultas. Ahora envía la referencia elegida a un callback del Admin que recarga la bandeja y resuelve el índice actual por ID antes de abrir el detalle. No marca leída, no modifica estados y no envía mensajes.

Si la consulta desapareció, avisa sin abrir otra. Si el usuario cambió de sección, la pantalla no cargó o una revisión posterior reemplazó a la anterior, no abre el modal obsoleto. El módulo de Pendientes mantiene la navegación general cuando el callback no está disponible (compatibilidad con versiones previas). Se actualiza la versión del recurso en Admin.

Pruebas: seis nuevas ejecutan el callback real y el módulo real con un DOM mínimo: resolución por referencia, consulta ausente, cambio de sección/carga fallida, concurrencia de dos revisiones, tarjeta que envía su propia referencia y fallback de compatibilidad. En conjunto con estados, listado y revisión: 25 pruebas locales satisfactorias. No se modificaron Worker ni permisos.

Inspección inicial en staging: 14 pendientes cargados; filtro Consultas de contratación deja 1 visible, la consulta ficticia CON-0fe1652283a3a3f956ec9b876559acdb0d16b77b552f29bb25a30bb36ece4852. Pendiente verificar la nueva navegación servida por Pages y CI. No se cerraron ni rechazaron registros durante esta inspección.

## Verificación real completada

Pages informó sourceCommit 6918cae6894bea8827681095990dc7512f83d8f9 y el DOM cargó el recurso con v=20261017-inquiry-detail. Desde Pendientes, filtro Consultas de contratación (14 cargados, 1 visible), se pulsó Revisar. Tras cargar Consultas, abrió automáticamente el modal con referencia CON-0fe1652283a3a3f956ec9b876559acdb0d16b77b552f29bb25a30bb36ece4852 y artista QA PRO INTEGRAL 1510; conservó Nueva. Se cerró sólo el modal mediante Volver a consultas. No hubo cambios de estado ni envíos externos.

GitHub Actions del commit 9b53fd30375d612a47d5f6ba8ba3328f19bc426c: Platform integration checks 695 y Job status contract checks 329 satisfactorios. Sintaxis de módulo y script inline comprobada. Las pruebas de carreras son automatizadas; no se reprodujo concurrencia de dos operadores en el navegador.
