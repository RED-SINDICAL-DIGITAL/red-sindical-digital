# Auditoría ampliada de accesos y navegación — 17/10/2026

## Correcciones

- Todas las acciones Aprobar/Rechazar y Completar sincronización transportan el ID del reclamo mostrado y verifican que siga coincidiendo con el registro del índice actual antes de pedir la nota o enviar cambios.
- Se impide una revisión duplicada del mismo reclamo mientras está en curso. Se conserva cancelación sin cambios, nota obligatoria de aprobación y confirmación de conflictos.
- Un resultado tardío no navega desde otra sección ni muestra el enlace privado sobre otro modal; invalida las cachés de solicitudes, artistas y propietarios para la próxima carga. La recuperación de aprobación parcial también respeta la pantalla actual.
- Evidencias sólo abren URL HTTP/S válidas sin usuario/contraseña incrustados, con noopener/noreferrer. Protocolos ejecutables o URL malformadas muestran Enlace no válido. No se abrieron evidencias externas para probarlo.
- La lista de Solicitudes identifica al artista por nombre junto al ID.
- El router descarta errores y posprocesamiento de cargas anteriores. Artistas y Consultas también descartan su renderizado tardío tras otra navegación, incluso al recargar la misma sección. Salir invalida la navegación en curso. No se afirma que todas las otras vistas del Admin ya tengan el mismo control antes de renderizar.

## Validación

63 pruebas locales satisfactorias: guardado, fechas PRO, historial de navegación, consultas, Pendientes, cancelación y dos suites nuevas (9 de seguridad de reclamos/enlaces y 8 de navegación/cierre de sesión). Después se agregó una comprobación adicional de generación de navegación al contexto de revisión; falta CI del conjunto final.

Prueba de integración aislada del Worker real + SQLite satisfactoria: rechazo de borrador revoca acceso privado; reclamo de artista existente requiere verificación; aprobación vincula automáticamente; otra cuenta no obtiene acceso; revocar propietario invalida sesión e invitación. Sólo datos en memoria/SQLite local, sin mutaciones remotas.

Pendientes: sintaxis final, CI, revisión visual y cancelación desde la nueva UI de staging, navegación rápida real y uso con dispositivos físicos. No se aprobará una propiedad real para este control. No se modifican Worker, datos de producción, secretos ni pagos. Los guardas del frontend no sustituyen controles del servidor y no garantizan exclusión entre dos operadores independientes.
