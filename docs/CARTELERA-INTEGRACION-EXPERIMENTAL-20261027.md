# Cartelera: integración experimental aislada

El Worker contiene una ruta experimental para el POST de eventos, limitada a la URL de staging y a la variable EVENT_ATOMIC_STAGING=true. La variable no se ha configurado. Esta fuente no es una entrega lista para activar o desplegar.

En SQLite/KV en memoria y con el Worker real se verificaron el envío concurrente idéntico, el rechazo de contenido distinto bajo la misma referencia, el reintento tras fallo de una escritura de KV y el recorrido por moderación. El evento y su intención se guardan juntos en D1; las copias KV se reintentan con el mismo identificador. No se ejecutaron llamadas ni escrituras remotas.

Pendientes que impiden activar el circuito: recuperación fiable de los avisos cuando el primer guardado en KV falla; proteger las proyecciones KV contra escrituras concurrentes de eventos diferentes; integración del reintento seguro en el formulario, que actualmente lo bloquea tras una respuesta incierta; pruebas de permisos, cambios de moderación, borrado y notificaciones, y validación con D1 real aislado en Cloudflare. La confirmación de la transacción aislada no es una certificación de producción. No reutilizar el paquete 11769 para este cambio.

## Actualización: cola de avisos integrada
El Worker experimental incorpora el componente actualizado: evento, intención y avisos se insertan en el mismo batch D1, con identificadores de aviso deterministas. Se eliminó la emisión separada después de la copia KV en esa ruta. La prueba del Worker completo provoca una interrupción de KV y verifica un solo aviso antes y después del reintento. Esto resuelve el registro durable del aviso en la ruta experimental; no verifica envío por proveedor, cron ni entrega al destinatario. La integración continúa desactivada. Sigue pendiente la concurrencia de copias de eventos distintos y el circuito de entrega/reintento de avisos.
