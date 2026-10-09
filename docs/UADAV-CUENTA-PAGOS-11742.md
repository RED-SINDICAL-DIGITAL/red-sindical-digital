# UADAV STREAM · Cuenta y pagos · Worker 11742 / interfaz 12036

## Qué se corrigió
La asociación cuenta–artista queda guardada en D1 y ya no vence junto con la invitación privada. Se migran las asociaciones existentes a duración indefinida. Las sesiones privadas duran una hora; cada acceso comprueba el propietario vigente y la vigencia de la cuenta o dispositivo. Desvincular, revocar un dispositivo o cambiar el propietario sigue quitando el acceso.

Los dominios permitidos se normalizan: una barra final en ACCOUNT_ALLOWED_ORIGINS ya no produce un falso rechazo. No se agregan dominios ni comodines. Un 403 incluye un código: ORIGIN_NOT_ALLOWED, ARTIST_OWNER_CHANGED, ARTIST_ACCOUNT_MISMATCH o ARTIST_NOT_LINKED. El mensaje indica la acción adecuada. Abrir un enlace inválido no borra la marca de una sesión vinculada válida.

No se ha identificado todavía cuál de estos motivos produjo el 403 del dispositivo del usuario: hace falta la respuesta JSON de esa solicitud o reproducirla con su sesión. No se omiten controles para resolverlo.

## Recorrido simple
1. Mi perfil guarda la cuenta. PC y móvil usan la misma cuenta al vincularse por QR.
2. El artista se vincula a esa cuenta y crea el pedido PRO desde ella.
3. Informar la transferencia guarda el aviso. No demuestra que el dinero ingresó.
4. Una confirmación bancaria autenticada, con referencia exacta del pedido, importe, moneda y cuenta de destino correctos, activa PRO y sus cupos automáticamente.
5. El artista entra desde Mi perfil. No necesita recibir otro enlace después de pagar.

La activación y el registro del pago se confirman juntos en una transacción D1. Cada transacción bancaria sólo puede usarse en un pedido; las notificaciones repetidas no prolongan PRO ni duplican cupos. Las renovaciones agregan tiempo desde el vencimiento vigente. Los cupos y la vista KV se pueden reintentar después de la confirmación D1.

## Pendiente imprescindible: conectar el banco
Este lanzamiento incluye un receptor para un adaptador confiable. **No incluye una conexión real con Mercado Pago ni con otro banco.** Tener alias, CVU o un comprobante no proporciona acceso a los movimientos bancarios. No se promete una integración gratuita sin verificar las condiciones del proveedor.

Mientras no se conecte un proveedor que confirme el ingreso, la transferencia informada continúa requiriendo confirmación manual. El Admin lo indica; la IA de moderación no verifica pagos.

El adaptador debe leer movimientos acreditados mediante una API autorizada del banco o proveedor y enviar únicamente ingresos verificados. No debe firmar documentos subidos por clientes como si fueran movimientos reales. Es imprescindible probar con una transferencia real controlada antes de anunciar automatización.

### Contrato técnico del receptor
Guardar sólo como secretos/variables del Worker, nunca en el navegador ni en el repositorio:
- PRO_BANK_CONFIRMATION_SECRET: secreto aleatorio de al menos 32 caracteres compartido exclusivamente con el adaptador.
- PRO_BANK_ACCOUNT_ID: identificador exacto de la cuenta receptora que informa el proveedor.

POST /api/pro/bank-confirmation, con cuerpo JSON:

```json
{"order_id":"PEDIDO-123","transaction_id":"TRANSACCION-UNICA","status":"credited","amount":5000,"currency":"ARS","recipient_account_id":"CUENTA-DEL-PROVEEDOR"}
```

Cabeceras:
- X-UADAV-Timestamp: instante Unix en milisegundos, 13 dígitos, máximo cinco minutos de diferencia.
- X-UADAV-Signature: sha256= seguido del HMAC-SHA256 hexadecimal del texto `timestamp + '.' + cuerpoJSONExacto` con el secreto.

No reutilizar el ejemplo como confirmación de una transferencia real. El adaptador debe generar su firma después de consultar la fuente bancaria confiable. Una firma válida acredita al adaptador, no por sí misma la existencia del ingreso: la verificación bancaria es responsabilidad del adaptador.

Respuestas: 200 activado o reintento completado; 401 firma/tiempo inválido; 404 pedido inexistente; 409 conflicto de pedido/transacción; 422 importe, moneda, destino o estado incorrecto; 503 sin configurar o fallo recuperable. Reintentar 503 con una firma nueva y la misma transacción/pedido. No modificar importe ni referencia para resolver una excepción.

## Pruebas
SQLite real: vinculación permanente, aislamiento entre cuentas, revocaciones, normalización de origen, HMAC inválido/vencido, importe/destino incorrectos, aviso de cliente sin activación, confirmaciones concurrentes, transacción única y renovación sin duplicaciones. También se verificaron dispositivos, cupos PRO, moderación, recuperación de acceso, scripts de las páginas y entrada única del inicio.

## Despliegue
Reemplazar el Worker por releases/worker-UADAVSTREAM-V11.7-11742.js. Mantener los bindings y secretos existentes. Las tablas se preparan automáticamente. La interfaz 12036 informa el estado real de la conexión. No borrar la cuenta del navegador para corregir un 403: podría separar el dispositivo de su cuenta.
