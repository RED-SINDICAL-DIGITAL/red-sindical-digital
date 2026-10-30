# Biblioteca y guardado en el reproductor · 30/10/2026

Pages staging exclusivamente; producción y Worker sin cambios.

Biblioteca directa entra al contenedor persistente, conservando pestaña, búsqueda y fragmento. El modo embebido no redirige ni genera bucles. Se elimina la apertura externa de la fuente si no se encuentra el reproductor; se explica cómo reintentar.

Favorito y Más tarde del contenedor manejan lectura/escritura fallida o datos corruptos. No sobrescriben una estructura ilegible ni anuncian éxito ni disparan sincronización cuando falla. La interfaz cambia solo después del guardado; filas malformadas no se propagan en una operación válida.

744/744 pruebas CJS aprobadas, incluyendo búsqueda/paginación, biblioteca de canales, seguimiento, compartir y regresiones del reproductor. No equivale a certificar todos los recorridos en hardware real. El operador confirmó reproducción correcta en PC y móvil después de la corrección anterior cf0b2d7.

## Comprobación en vivo y simplificación
Búsqueda Masterboy 24→45 resultados; perfil 50→100 videos. Seguir se refleja en Artistas seguidos, y se revirtió el seguimiento de prueba. Copiar enlace público muestra confirmación, sin enviar WhatsApp. Favorito guardado desde el reproductor aparece en Biblioteca y al abrir Favoritos en otra pestaña. Entrada directa /biblioteca.html?tab=favorites conserva la pestaña dentro de app.html.

El reproductor local se presenta plegado en un details nativo, expandible con teclado o tacto; conserva todos sus controles y no modifica los archivos. Los archivos personales no se suben. Nueva ejecución 744/744 aprobada.
