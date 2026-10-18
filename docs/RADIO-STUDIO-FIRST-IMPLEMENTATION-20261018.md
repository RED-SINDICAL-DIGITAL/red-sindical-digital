# Radio Studio: primera implementación — 18/10/2026

Actualiza el hallazgo anterior RADIO-OPERATOR-GAP-AND-INTEGRATION-20261018.md. Ya existe una implementación inicial en la rama; todavía no se declara operativa en staging.

## Implementado
- radio-studio.html: misma cuenta de la aplicación, emisoras autorizadas, bandeja de últimos 100 pedidos por emisora, filtros y estados En cola/Sonó/Descartado.
- API GET radio-studio y GET/PATCH radio-studio/requests: identidad validada mediante el mecanismo existente, permiso revocable por account_id/radio_id y respuestas no-store.
- Tabla D1 radio_operators creada de forma aditiva. No se conceden permisos automáticamente ni por conocer el ID público.
- API Admin GET/PUT admin/radio-operators: concesión/revocación con cuenta existente, emisora disponible, confirmación y motivo verificado. Sin entregar ADMIN_KEY al operador.
- UPDATE del pedido restringido por emisora y permiso activo en la propia sentencia SQL. No permite modificar pedidos de otra radio.
- Cambio de cuenta limpia la interfaz y descarta respuestas tardías. No crea cuentas ni muestra credenciales.

## Pruebas
Integración Worker real con SQLite/KV aislados satisfactoria: dos cuentas/dos emisoras, concesión y revocación ficticias, denegación cruzada, estados, ningún acceso al listado central Admin. Cinco pruebas de la interfaz real: cuenta ausente, sin permisos, carga repetida, cambio de cuenta y respuesta de emisora incorrecta. Sintaxis comprobada. Regresión de interacción anterior satisfactoria.

## Pendiente antes de habilitar operadores
1. Desplegar Worker 9a5e1aefa975fcf9df5af79e68cea347c729a000 (o posterior validado) sólo en uadav-api-staging, con bindings aislados.
2. Interfaz Admin para seleccionar cuenta/emisora, verificar, conceder y revocar; por ahora sólo existe el endpoint. Ninguna concesión real se hizo.
3. Acceso contextual desde Mi perfil y prueba con sesiones reales de dos operadores.
4. Chat/respuestas del operador todavía NO incluidos; sólo bandeja de pedidos y estados.
5. Pruebas en móvil/tablet/PC y revocación entre dispositivos. La página tiene CSS adaptable, no equivale a validación física.
6. Auditoría conserva eventos de cambio mediante logger existente; debe comprobarse su entrega real.

## Límites de almacenamiento
Studio lee y actualiza D1 sin fallback permisivo. El KV heredado puede conservar un estado anterior tras una actualización desde Studio si D1 falla posteriormente; falta conciliación unificada. No se garantiza transacción distribuida. El Admin en funcionamiento normal lee estado D1 por encima del JSON legado.
Conocer o pagar por una emisora no otorga permisos de operador. No se modificaron producción, pagos, secretos ni permisos reales.
