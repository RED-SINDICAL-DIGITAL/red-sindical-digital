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

## Evidencia posterior y corrección del buscador

La nueva lista de Solicitudes se vio en staging con nombres de artistas. Se abrió la solicitud QA DEMO PERFIL 1700, se inició Rechazar y se canceló el diálogo de nota. Conservó Pendiente y el total de solicitudes pendientes siguió en 10. No se aprobaron ni rechazaron accesos remotos. Se recorrió Consultas → Artistas con carga normal; Consultas terminó antes del cambio final, por lo que esa interacción no reproduce una carrera real. Las carreras sólo quedaron verificadas en pruebas automatizadas.

CI del commit 95fc1f9e0279aac9f0d05c45c27c6fa539cc0400: Platform integration checks 715 y Job status contract checks 335 satisfactorios. Sintaxis final comprobada antes del hallazgo siguiente.

La inspección visual encontró que el buscador superior no ocultaba filas de solicitudes: sólo seleccionaba filas con data-search. Se amplía a las filas de tablas de la sección actual, combinando texto visible y metadatos de búsqueda. Informa coincidencias o ausencia de resultados con un estado accesible; borrar la búsqueda restaura las filas. No consulta otros módulos ni descarga registros adicionales del backend. Las vistas sin tablas no muestran un contador confuso.

Con cuatro pruebas nuevas de búsqueda, el conjunto final ejecutado tiene 67 pruebas satisfactorias. Pendiente: CI y verificación visual de esta última búsqueda corregida en Pages. No se han revisado todas las tablas o dispositivos físicos.

## Cierre de verificación del buscador

En la nueva UI de staging, Solicitudes + búsqueda QA DEMO PERFIL 1700 dejó una fila y mostró Coincidencias: 1 de 10 registros. Una búsqueda inexistente ocultó las filas y mostró No hay registros que coincidan con esta búsqueda. Borrar el texto restauró las 10 solicitudes. No hubo escrituras de registros. Evidencia visual del resultado filtrado guardada durante la sesión.

CI del conjunto con buscador (commit 70599fab014d0cc006072928f51459c3a1be8e2e): Platform integration checks 720 y Job status contract checks 337 satisfactorios. 67 pruebas locales del conjunto final y sintaxis inline satisfactorias. Continúan pendientes integración visual desde la cuenta del artista, concurrencia real de operadores, pantallas físicas y pagos reales al final.
