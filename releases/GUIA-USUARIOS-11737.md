# Nombres de usuario · Worker 11737

Gratis y PRO pueden elegir el nombre desde Mi perfil, en el acceso privado de artista. No se cobra por identidad ni por recibir consultas.

Formato: 3–30 caracteres ASCII, números, puntos, guiones y guiones bajos, con letra o número al inicio/final. Se normaliza a minúsculas. Hay nombres institucionales y de administración reservados.

D1 crea artist_handles y artist_current_handles automáticamente al usar la opción autenticada. Se comprueba el token, vencimiento y propietario activo antes de modificar. La unicidad reside en D1, con guardado de alias y selección actual en un batch atómico. Los alias anteriores se conservan y no se asignan a otro artista. Elegir usuario no otorga una insignia de identidad verificada.

El enlace funcional es /artista.html?usuario=nombre. El enlace con imagen de Compartir sigue usando el identificador público. /@nombre aún requiere configuración del dominio y no se anuncia como activo.

Desplegar releases/worker-UADAVSTREAM-V11.7-11737.js conservando bindings y secretos. Health debe indicar build 11737. No se incluyen datos bancarios ni claves de IA en el código público. Las nuevas tablas deben agregarse al procedimiento de respaldo.

Pruebas: acceso gratis, nombres reservados, colisión, carrera de unicidad simulada, alias anteriores, perfiles ocultos, accesos vencidos y regresiones de press kit, compartir y playlists.
