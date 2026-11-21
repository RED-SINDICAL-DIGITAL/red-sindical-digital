# Inspección autenticada del Admin de staging — 15/10 UTC

Se consiguió iniciar sesión mediante browserAuth; no se leyó ni registró la clave. Producción no se abrió para escritura.

## Comprobado en la interfaz real

- Visión general: cuatro artistas, una radio, cero eventos, seis pendientes. Desglose: cuatro accesos a perfiles y dos moderaciones. La bandeja mostró seis cargados y seis visibles.
- Pendientes diferencia Revisar acceso/Rechazar acceso de Revisar contenido/Rechazar contenido.
- Moderación muestra nombre, versión disponible, presentación legible y explicación de revisión manual. Detalles técnicos plegados. Botones Aprobar cambios/Rechazar cambios para perfiles. No se accionó ninguno.
- Configuración: moderación habilitada, Gemini seleccionado, Gemini y Groq sin clave, límite 300. No se cambió configuración ni se probó un proveedor externo.
- Artistas: Traer de YouTube, Nuevo artista, Perfiles, Solicitudes, PRO y estadísticas presentes. Cuatro perfiles sintéticos ocultos en plan gratuito.
- Gestionar plan de PRUEBA VISUAL QA 2235 abrió con plan, vencimiento, origen y analytics. Se canceló sin guardar.
- Resumen PRO del mismo artista cargó plan GRATIS, apoyo sin enlaces, analytics no activo y nueve tipos de métricas internos, con aclaración de que no son estadísticas oficiales de YouTube/Spotify.

## Pendientes

No se otorgó PRO ni se publicó un perfil. Falta circuito de aprobación de pago y acceso automático, edición/publicación del Press Kit con PRO vigente y prueba de contenido moderado desde una cuenta de artista recuperada. La sesión de artista anterior ya no está en el navegador actual; esto no demuestra un fallo del backend de sesiones. Falta inspección en móvil/tablet/TV reales. Se observó el aviso de pruebas rozando la cabecera fija del Admin; revisar espaciado sin alterar producción.
