# Admin · filas de portada · 30/10/2026

Solo Pages staging. Producción y Worker intactos.

Se usan etiquetas de selección y diseño comprensibles: Elegidos, Automático, Elegidos y automáticos; Horizontal, Afiche, Cuadrado, Circular, Radio y Evento. Los botones del diálogo dicen Preparar sección / Preparar destacado: Guardar cambios sigue siendo el paso que publica el borrador.

El máximo de elementos debe ser un entero de 1 a 24, igual al límite del renderer público. Vacío usa 18. Se rechazan cantidades superiores, negativas, decimales o no finitas, manteniendo abierto el editor y sin modificar la sección. Un ID ya usado por otra sección también se rechaza antes de cambiar el borrador; mantener el ID propio sigue permitido.

Se elimina la captura duplicada de campos en el reordenamiento de bloques, reutilizando captureHomeFields. Se conservan los borradores de portada.

750/750 pruebas CJS aprobadas, incluidas regresiones de límites, colisiones de ID, conservación de campos, guardado simultáneo y fallo parcial. No implica guardado transaccional de las cuatro configuraciones.
