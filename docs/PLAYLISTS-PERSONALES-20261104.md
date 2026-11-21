# Cola de playlists personales · staging · 4/11/2026

Base: 66589b2a76c7514701ee0db82fa46df1ee8dd1b3.

Biblioteca ofrece Reproducir videos: toma una instantánea de hasta 250 entradas, conserva orden y repeticiones, y admite IDs de YouTube o enlaces HTTPS de sus dominios oficiales. Otras fuentes quedan disponibles individualmente. No modifica las listas guardadas.

Reutiliza createQueue y el reproductor embebido existentes; no consulta playlist_items para listas personales. Anterior/Siguiente, selección de tema, final y salto de restricciones 100/101/150 siguen el mismo circuito probado. Un error genérico conserva Reintentar, sin saltos en bucle ni apertura externa.

El reproductor pertenece a app.html y se conserva durante la navegación; el elemento actual se registra para recuperación tras recarga. La recuperación puede requerir intervención Play del navegador; no se certifica continuidad audible después de recargar.

Pruebas: 769/769 de interfaz aprobadas, incluidas normalización de fuentes, rechazo de otros proveedores, límites, avance por ended, identidad del evento, restricción embebida, fin de lista y ausencia de consulta remota para el snapshot personal. Worker sin cambios. Producción intacta.

Pendiente validación audible real en PC/móvil. No equivale a una cola universal para Vimeo, archivos locales, radios o proveedores de terceros.
