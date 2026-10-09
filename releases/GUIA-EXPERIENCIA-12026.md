# Experiencia 12026

- El player y el miniplayer muestran el título del tema seleccionado de la cola, con estado Reproduciendo/En pausa. El título permite ampliar el player con clic, Enter o espacio.
- Las tarjetas de playlists y colecciones indican Sonando/En pausa y el tema actual. Solicitan el estado al volver a la página. Solo se aceptan mensajes del frame padre y del mismo origen.
- Los controles completos de cola se ocultan al minimizar. Se conserva el iframe reproductor; navegar dentro de la aplicación no reinicia la reproducción.
- Se elimina la minimización automática por rueda: desplazarse por los temas no minimiza inesperadamente el player. Se conservan el botón y el gesto táctil existentes.
- Navegación: búsqueda, pestaña y posición de páginas públicas se guardan temporalmente en memoria y se recuperan al regresar. Máximo 40 rutas; se excluyen páginas privadas y URLs con token. El contenido remoto puede demorar la restauración; se observa como máximo ocho segundos.
- Compartir: no permite copiar ni abrir WhatsApp hasta resolver el enlace público. Si no obtiene el enlace dinámico, informa que la vista previa puede ser general. Los fallos temporales no quedan cacheados para siempre en la página.
- WhatsApp: pegar la dirección directa artista.html entrega la tarjeta general del HTML estático. El botón Compartir usa el enlace dinámico del Worker cuando está disponible, con la imagen y descripción públicas del artista. No se controla la caché de WhatsApp.

No requiere otro Worker: utiliza las funciones de 11735. Los perfiles privados, herramientas PRO y datos guardados no se modifican.

Validación: player-experience-12026.mjs (módulo nuevo de cola), comprobación de sintaxis, pruebas de vistas previas de compartir y simulación visual de selección de temas. La simulación no demuestra reproducción real ni funcionamiento con el celular bloqueado.
