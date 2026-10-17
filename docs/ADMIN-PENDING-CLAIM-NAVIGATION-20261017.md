# Pendientes → solicitud de acceso — 17/10/2026

Revisar acceso envía el ID de la solicitud al Admin, recarga Artistas, comprueba la sección cargada, resuelve el índice actual por ID, selecciona Solicitudes y abre la revisión existente. No ejecuta aprobaciones, rechazos, publicaciones ni cambios PRO. El modal identifica al artista por nombre e informa que revisar no aprueba ni publica. La identificación del solicitante permanece como solo lectura.

Comparte el contador de navegación con la revisión directa de consultas para descartar aperturas obsoletas. Ante solicitud ausente avisa sin abrir otro registro. Ante sección distinta o carga incompleta no abre el modal. El módulo conserva navegación general de compatibilidad cuando falta el callback.

34 pruebas locales satisfactorias: 11 de navegación de Pendientes (cinco nuevas de acceso), 7 de estados de consultas, 6 de listado, 6 de revisión/fechas pendientes y 4 de cancelación de revisión. Sintaxis y comprobación visual de Pages pendientes. Las pruebas de callbacks no equivalen a una auditoría completa del router ni a carreras reales entre operadores. No se modifica Worker ni producción.
