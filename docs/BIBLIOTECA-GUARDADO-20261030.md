# Biblioteca y guardado en el reproductor · 30/10/2026

Pages staging exclusivamente; producción y Worker sin cambios.

Biblioteca directa entra al contenedor persistente, conservando pestaña, búsqueda y fragmento. El modo embebido no redirige ni genera bucles. Se elimina la apertura externa de la fuente si no se encuentra el reproductor; se explica cómo reintentar.

Favorito y Más tarde del contenedor manejan lectura/escritura fallida o datos corruptos. No sobrescriben una estructura ilegible ni anuncian éxito ni disparan sincronización cuando falla. La interfaz cambia solo después del guardado; filas malformadas no se propagan en una operación válida.

744/744 pruebas CJS aprobadas, incluyendo búsqueda/paginación, biblioteca de canales, seguimiento, compartir y regresiones del reproductor. No equivale a certificar todos los recorridos en hardware real. El operador confirmó reproducción correcta en PC y móvil después de la corrección anterior cf0b2d7.
