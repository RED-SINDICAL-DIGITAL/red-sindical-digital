# Revisión final concentrada · 28/10/2026

La última revisión se limitó a errores de Bolsa y Cartelera, sin cambios visuales ni activación de funciones pendientes.

Se corrigió una omisión: `event_publication_intents` se incluye ahora en las dos listas de tablas de exportación. La prueba genera una referencia sintética, exporta el respaldo, verifica su contenido y su digest y comprueba que no hubo escrituras KV. No equivale a probar una restauración operativa de Cartelera.

Resultados: 399 pruebas del Worker y 173 de interfaz aprobadas, sin fallos ni pruebas omitidas en esas ejecuciones. Bolsa no mostró regresiones; se conservan sus evidencias previas. No se repitieron correos reales, restauraciones remotas ni escrituras de contenido.

Cartelera aún tiene pendientes operativos que impiden certificar un cierre completo: entrega de avisos, cobertura canónica de importaciones/mantenimiento, restauración de referencias y validación del circuito experimental con D1 real aislado. No se habilita EVENT_ATOMIC_STAGING, no se habilita la recuperación histórica de ofertas por correo y no se modifica producción.

El código candidato sigue identificado como 11770. El último Worker de staging comprobado continúa en 11769; este cambio no se presenta como desplegado. El siguiente paso debe concentrarse en esos bloqueos; no volver a rediseñar ni a repetir circuitos de Bolsa ya validados sin nueva evidencia de fallo.
