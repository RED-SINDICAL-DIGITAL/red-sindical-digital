# Revisión de solicitudes de artista — 17/10/2026

Revisión visual en Admin de staging, con sesión administrativa existente y solicitud sintética QA DEMO PERFIL 1700. No se aprobaron ni rechazaron solicitudes ni se modificaron permisos.

## Correcciones

- Cancelar el diálogo de nota de revisión termina la operación: antes, cancelar un rechazo podía enviar una nota vacía y rechazar la solicitud.
- Los datos declarados del solicitante se muestran como solo lectura; la pantalla no dispone de una operación para editarlos.
- Se explica el efecto real del Worker: aprobar concede la gestión al solicitante verificado y, cuando registration_pending es true, publica el nuevo perfil. No concede PRO ni afiliación. Se mantiene la exigencia de nota de verificación y el control de conflictos.

## Validación

10 pruebas locales satisfactorias: cuatro ejecuciones de la función real de revisión (cancelar rechazo, cancelar aprobación, exigir evidencia y rechazo confirmado), más seis de revisión de contenidos y pendientes. Se incorpora la regresión al workflow existente.

Pendiente: comprobar la nueva pantalla servida por Pages y el resultado de CI. La inspección visual corresponde al código anterior al cambio. No se probó una aprobación real ni una eliminación. Producción y pagos permanecen intactos.

## Comprobación posterior en staging

La nueva pantalla servida muestra los datos como solo lectura y la advertencia de publicación. Se abrió Rechazar para QA DEMO PERFIL 1700 y se canceló el diálogo de nota: la solicitud permaneció pendiente y la lista mantuvo sus 10 solicitudes. No se confirmó ningún rechazo. La sesión administrativa se recuperó después de recargar. CI del commit 65a3218c340bdce0859ea990f7d0ba870af1fb5f: Platform integration checks 653 y Job status contract checks 315 finalizaron correctamente.

## Guardado de artistas

Se bloquea el doble envío mientras se guarda, se muestra Guardando… y se restablece el estado previo de los controles al terminar. Ante fallo se conservan los datos y la caché previa; no se reintenta automáticamente. Una respuesta tardía no cierra otro editor ni redibuja una sección distinta. Esto no sustituye el control de concurrencia del catálogo en el servidor ni resuelve una respuesta perdida tras una escritura efectiva.

18 pruebas locales satisfactorias: guardado (4), cancelación de revisión (4), pendientes/revisión (6) y fechas PRO (4). Se incorpora guardado a CI. Pendiente verificar este último cambio de guardado en la UI servida; no se simularon fallos de red en el navegador ni aprobaciones reales.
