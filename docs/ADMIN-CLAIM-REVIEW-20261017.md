# Revisión de solicitudes de artista — 17/10/2026

Revisión visual en Admin de staging, con sesión administrativa existente y solicitud sintética QA DEMO PERFIL 1700. No se aprobaron ni rechazaron solicitudes ni se modificaron permisos.

## Correcciones

- Cancelar el diálogo de nota de revisión termina la operación: antes, cancelar un rechazo podía enviar una nota vacía y rechazar la solicitud.
- Los datos declarados del solicitante se muestran como solo lectura; la pantalla no dispone de una operación para editarlos.
- Se explica el efecto real del Worker: aprobar concede la gestión al solicitante verificado y, cuando registration_pending es true, publica el nuevo perfil. No concede PRO ni afiliación. Se mantiene la exigencia de nota de verificación y el control de conflictos.

## Validación

10 pruebas locales satisfactorias: cuatro ejecuciones de la función real de revisión (cancelar rechazo, cancelar aprobación, exigir evidencia y rechazo confirmado), más seis de revisión de contenidos y pendientes. Se incorpora la regresión al workflow existente.

Pendiente: comprobar la nueva pantalla servida por Pages y el resultado de CI. La inspección visual corresponde al código anterior al cambio. No se probó una aprobación real ni una eliminación. Producción y pagos permanecen intactos.
