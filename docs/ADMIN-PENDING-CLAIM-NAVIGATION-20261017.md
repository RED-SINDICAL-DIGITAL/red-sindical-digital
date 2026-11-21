# Pendientes → solicitud de acceso — 17/10/2026

Revisar acceso envía el ID de la solicitud al Admin, recarga Artistas, comprueba la sección cargada, resuelve el índice actual por ID, selecciona Solicitudes y abre la revisión existente. No ejecuta aprobaciones, rechazos, publicaciones ni cambios PRO. El modal identifica al artista por nombre e informa que revisar no aprueba ni publica. La identificación del solicitante permanece como solo lectura.

Comparte el contador de navegación con la revisión directa de consultas para descartar aperturas obsoletas. Ante solicitud ausente avisa sin abrir otro registro. Ante sección distinta o carga incompleta no abre el modal. El módulo conserva navegación general de compatibilidad cuando falta el callback.

34 pruebas locales satisfactorias: 11 de navegación de Pendientes (cinco nuevas de acceso), 7 de estados de consultas, 6 de listado, 6 de revisión/fechas pendientes y 4 de cancelación de revisión. Sintaxis y comprobación visual de Pages pendientes. Las pruebas de callbacks no equivalen a una auditoría completa del router ni a carreras reales entre operadores. No se modifica Worker ni producción.

## Verificación real en staging

Pages informó sourceCommit 51813af1c50c86ecef0ed5dae8e5c22d054de766 y el DOM cargó v=20261017-claim-detail. Desde Pendientes, buscar QA DEMO PERFIL 1700 dejó una tarjeta (14 pendientes totales). Revisar acceso abrió automáticamente la revisión del artista ART-266d08434699460d82fd6b042a47df23 y solicitante QA DEMO PERFIL 1700; el nombre apareció en la introducción, los campos siguieron como solo lectura y permaneció visible la advertencia sobre publicación al aprobar perfiles nuevos. Se cerró la ventana con Cerrar, sin aprobar ni rechazar. El listado quedó en Solicitudes y conservó esa solicitud Pendiente (10 pendientes de acceso).

GitHub Actions del commit 1ee7d5d743f5fa63161dae60029abaef02117105: Platform integration checks 704 y Job status contract checks 332 satisfactorios. Sintaxis del módulo y del script inline verificada. No se certifica una aprobación real, vinculación posterior al propietario ni uso desde dispositivos físicos con esta prueba de lectura.
