# Admin y CTA de portada · comprobación real 30/10/2026

En staging se verificó visualmente el rechazo de máximo 25 y de un ID perteneciente a otra fila. Ambos errores conservan el diálogo abierto; se cancelaron las pruebas sin publicar esos valores. Las cuatro filas existentes permanecen.

Se encontró el destino institucional #artistasSection, inexistente en el Home actual. Se corrigió desde el Admin a /artistas.html, manteniendo el texto Empezar a descubrir. Se pulsó Guardar cambios, se esperó la finalización y se recargó el Admin para comprobar persistencia. Desde la portada recargada, el botón abrió Artistas dentro de app.html. La pausa del carrusel se usó solo en la pestaña de prueba; no se cambió la configuración de rotación.

Código 612c88e: etiquetas claras, límites e IDs validados y captura de campos reutilizada. 750 pruebas CJS aprobadas; Cloudflare Pages y ui-and-isolation completaron correctamente. API y producción intactas. El guardado de portada sigue siendo de varias configuraciones con reporte de fallo parcial, no una transacción única.
