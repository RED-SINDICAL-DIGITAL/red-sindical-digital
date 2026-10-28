# Cartelera: integración experimental aislada

El Worker contiene una ruta experimental para el POST de eventos, limitada a la URL de staging y a la variable EVENT_ATOMIC_STAGING=true. La variable no se ha configurado. Esta fuente no es una entrega lista para activar o desplegar.

En SQLite/KV en memoria y con el Worker real se verificaron el envío concurrente idéntico, el rechazo de contenido distinto bajo la misma referencia, el reintento tras fallo de una escritura de KV y el recorrido por moderación. El evento y su intención se guardan juntos en D1; las copias KV se reintentan con el mismo identificador. No se ejecutaron llamadas ni escrituras remotas.

Pendientes que impiden activar el circuito: recuperación fiable de los avisos cuando el primer guardado en KV falla; proteger las proyecciones KV contra escrituras concurrentes de eventos diferentes; integración del reintento seguro en el formulario, que actualmente lo bloquea tras una respuesta incierta; pruebas de permisos, cambios de moderación, borrado y notificaciones, y validación con D1 real aislado en Cloudflare. La confirmación de la transacción aislada no es una certificación de producción. No reutilizar el paquete 11769 para este cambio.

## Actualización: cola de avisos integrada
El Worker experimental incorpora el componente actualizado: evento, intención y avisos se insertan en el mismo batch D1, con identificadores de aviso deterministas. Se eliminó la emisión separada después de la copia KV en esa ruta. La prueba del Worker completo provoca una interrupción de KV y verifica un solo aviso antes y después del reintento. Esto resuelve el registro durable del aviso en la ruta experimental; no verifica envío por proveedor, cron ni entrega al destinatario. La integración continúa desactivada. Sigue pendiente la concurrencia de copias de eventos distintos y el circuito de entrega/reintento de avisos.

## Continuación: catálogo canónico y publicaciones concurrentes

La rama experimental deja de escribir arrays compartidos durante POST /api/eventos. Cada evento tiene una copia independiente `event-publication-snapshot:v1:<id>`; D1 conserva el registro canónico y los avisos transaccionales. Los lectores de las tres colecciones de eventos superponen el estado actual D1 a las copias heredadas de KV, exclusivamente con EVENT_ATOMIC_STAGING=true y el hostname exacto de staging. Una baja administrativa conserva una marca deleted en D1, evitando que una copia vieja o un reintento de publicación reactive el evento.

Prueba integrada: dos publicaciones diferentes simultáneas; ambas visibles en catálogo y colecciones Admin aunque KV omita una; edición de la omitida; eliminación con copia vieja; reintento del envío eliminado sin republicación. Las pruebas existentes de error de copia y reintento ahora interrumpen la copia individual real.

No se activa ni despliega esta integración. Siguen pendientes entrega de avisos, revisión de todos los caminos administrativos/importación/mantenimiento, respaldo y restauración de las nuevas referencias y comportamiento ante errores D1 en mutaciones administrativas. Las copias individuales no sustituyen un backup integral.

## Mutaciones administrativas transaccionales

PUT y DELETE de /api/cartelera, bajo el mismo bloqueo experimental, guardan la versión anterior y modifican el evento canónico en un único batch D1. No escriben listas KV. La comparación de la versión leída impide sobrescribir silenciosamente otra edición concurrente: responde 409 y solicita actualizar. Una excepción transaccional responde 503 sin confirmar éxito. Un evento que todavía exista únicamente en KV requiere migración antes de editarse por este circuito (409); esta limitación impide activar la integración sin completar la migración.

Pruebas integradas adicionales: rollback de edición e historial, rollback de eliminación e historial, reintento posterior exitoso, dos ediciones concurrentes con un único historial y una respuesta 409. La inyección de fallo se ejecuta dentro del batch SQLite, después de las escrituras, para comprobar rollback real.

Pendientes para activar: creación administrativa, migración de eventos heredados, importaciones/mantenimiento y caminos alternativos de modificación, entrega de avisos y respaldo/restauración. No se desplegó ni activó el flag experimental.

## Pasada consolidada build 11770

La creación administrativa ya usa intención idempotente en el circuito experimental. La edición migra puntualmente registros heredados mediante INSERT OR IGNORE sin reemplazar una fila D1 más nueva. Se bloquearon las sustituciones completas por endpoints antiguos. La consulta por referencia permite confirmar una publicación incierta sin volver a publicarla. El Admin bloquea doble clic y conserva formularios ante fallo o respuesta incompleta.

Ver `CIERRE-QA-BOLSA-CARTELERA-20261027.md` para el estado vigente y las pruebas. Se resolvieron esos pendientes de creación, migración puntual y comprobación de envío; continúan pendientes entrega de avisos, importación/mantenimiento, respaldo de referencias y D1 real aislado. El flag permanece sin activar y el Worker operativo continúa en 11769.

## Lote integral local del 28/10/2026

Importación canónica, mantenimiento D1, destacados pagos, ledger de avisos y ensayo de restauración están implementados y probados en el lote descrito en `CARTELERA-11770-LOTE-INTEGRAL-20261028.md`. Los avisos están restringidos al destinatario de QA y desactivados por defecto. Se preparó el archivo único de release 11770. Siguen pendientes el despliegue, la validación D1 remota y la recepción real del aviso; no se activó ninguna variable ni se modificó producción.
