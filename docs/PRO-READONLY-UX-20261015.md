# Herramientas con PRO no vigente

La prueba visual anterior mostraba «Agregá el primero» con el botón de edición bloqueado. Se cambió el estado vacío a «No hay registros guardados» en modo consulta. Se agregó explicación de conservación de datos y enlace Mi PRO con artist_id explícito.

La presentación ya no ofrece compartir/abrir/copiar si PRO no está vigente o presskit_enabled es false. Su aviso diferencia presentación guardada de disponible para el público. Copiar enlace también valida el estado antes de actuar. No cambia permisos ni datos en backend.

Sintaxis y cuatro estados de disponibilidad comprobados localmente; siete pruebas de sesión previas pasan. Se agregó regresión al archivo artist-workspace-session.test.cjs ya ejecutado por CI. Falta comprobar el nuevo texto desplegado en navegador. No se probó publicación con una cuenta PRO activa ni visibilidad del perfil durante esta revisión. Producción y Worker no modificados.
