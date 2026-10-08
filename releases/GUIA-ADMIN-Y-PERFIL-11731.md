# Admin adaptable y contenido del perfil

Frontend 12014 · Worker V11.7 / build 11731

## Activación

El rediseño del Admin se publica desde GitHub. Para guardar y mostrar las preferencias del artista, reemplazá el código del Worker uadav-api con worker-UADAVSTREAM-V11.7-11731.js y desplegalo en Cloudflare. Conservá las variables, claves, KV y D1 actuales. No requiere nuevas claves ni migraciones.

Verificá que /api/health indique build 11731. El frontend conserva la edición de datos del perfil mientras funciona el servidor anterior, pero impide confirmar cambios de presentación que ese servidor no puede guardar.

## Admin

- Móvil y tablet hasta 1024 px: menú lateral que se abre y cierra, búsqueda y controles accesibles. Escape cierra el menú y devuelve el foco.
- Pantallas pequeñas hasta 760 px: tablas con nombre de campo en cada tarjeta y formularios de una columna.
- PC: menú lateral y tablas con desplazamiento dentro de su contenedor.
- TV: botón TV en la cabecera para agrandar textos y controles. Flechas para recorrer controles; Enter para activarlos. Escape cierra menú o edición. Las flechas dentro de campos de texto, listas y volumen mantienen su función normal.
- Las ventanas de edición conservan sus botones al pie mientras se desplazan los campos.

La vista TV ayuda con teclado/control remoto; el funcionamiento en televisores concretos depende de su navegador. No sustituye la prueba en el dispositivo.

## Artista

Mi perfil → Contenido de mi perfil: Videos, Playlists de YouTube, Música y audio, Clips, Transmisiones, Eventos. Guardar cambios con su acceso privado vigente.

Las opciones son gratuitas. No borran contenido ni modifican publicaciones en YouTube u otros servicios. Tampoco convierten videos en audio. Playlists requiere un canal válido y carga automática habilitada. La preferencia selecciona qué secciones presentar; no crea videos, álbumes ni transmisiones que no existan.

Admin → Artistas y perfiles → Editar ofrece las mismas opciones. Mantiene los controles de canal, consulta de YouTube, moderación y PRO.

## Validación

Pruebas de permisos, expiración, validación de preferencias, conservación de enlaces y separación de PRO. Pruebas de carga de artistas, YouTube, Radio, seguridad y vinculación de cuentas.

La prueba visual aislada tests/admin-responsive-preview.html usa componentes del Admin y datos de ejemplo, sin clave, API ni guardados reales. Sirve para revisar el diseño. El guardado dentro del Admin autenticado y los equipos físicos requieren verificación en la sesión del administrador.
