# Publicaciones lentas y operaciones antiguas

Rama de auditoria; sin fusion, despliegue ni datos reales.

## Protecciones nuevas

- Cada intento de publicacion lleva un token propio en D1.
- Antes de escribir el catalogo KV y cerrar la solicitud se verifica el token, estado publishing y bloqueo de catalogo vigente.
- Finalizar o revertir exige que el token siga siendo el del intento actual. Una operacion vieja no puede cerrar ni revertir una nueva.
- Liberar el bloqueo sigue condicionado a su token: una operacion vieja no borra el bloqueo de otra.
- Recuperacion administrativa compara el snapshot completo y comprueba dentro del UPDATE que no hay un bloqueo vigente. Un cambio concurrente devuelve conflicto, no se sobrescribe.

## Evidencia

Worker real + SQLite + KV ficticio: publicacion TV normal; demora de mas de 120 segundos antes de escritura (no se escribe KV); cambio a un intento/bloqueo nuevo durante la escritura (no se sobrescribe estado nuevo ni se borra su lock); cambio de intento durante recuperacion (409). Pasan tambien revision, migracion, proteccion KV y contratos anteriores.

## Limite pendiente: KV no tiene compare-and-swap

La comprobacion previa y la escritura KV no son una transaccion. Si el bloqueo vence o cambia mientras una escritura KV ya esta en curso, todavia puede llegar una escritura antigua. La prueba de intento nuevo comprueba proteccion del estado D1, no que desaparezca ese riesgo del catalogo. Otros endpoints tambien escriben arrays KV y pueden intervenir.

Para cerrar este riesgo hay que elegir y probar una fuente transaccional por registro en D1 con adaptacion de lectores/escritores, o serializar todos los escritores del catalogo mediante un coordinador. No basta agregar otro timeout ni renovar el lease antes del put. Mantener inscripciones cerradas y no promover la rama hasta pruebas D1/KV remotas y revision de todos los escritores.

No se ha creado staging Cloudflare. La integracion local no prueba latencias reales, reproduccion ni recuperacion de una caida total de D1/KV. Formularios, Admin y manual publico no deben anunciar esto como disponible todavia.
