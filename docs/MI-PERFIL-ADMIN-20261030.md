# Mi Perfil y borradores de portada · 30/10/2026

Solo Pages staging. Worker y producción sin cambios; sin modificaciones de identidad, permisos ni recuperación.

Mi Perfil agrega accesos a Favoritos, Playlists, Artistas seguidos y Radios favoritas. Cuenta y dispositivos se abre desde un acceso visible en Mis gestiones; el enlace expande el panel existente mediante el fragmento #profileSettings, sin crear un formulario alternativo.

Admin conserva los campos de portada escritos en pantalla antes de volver a dibujarla al editar filas/destacados. Captura reutilizable de textos y opciones, sin borrar campos que no están presentes. Los avisos distinguen preparar un cambio de guardarlo en el servidor. Guardar cambios impide envíos simultáneos y restaura el botón al terminar; conserva el diagnóstico de fallos parciales. El guardado de cuatro configuraciones no es transaccional: ante fallo parcial se informa qué falta y permite reintentar.

747/747 pruebas CJS aprobadas. Nuevas regresiones: conservar borradores, doble guardado y fallo parcial con reintento. HTML/JS analizados sin errores de sintaxis. Verificación autenticada del Admin pendiente: el navegador muestra Acceso administrativo, no hay sesión disponible. No se publica contenido de prueba desde el Admin.
