# Radio: bandeja probada y Studio pendiente — 18/10/2026

## Evidencia
Prueba nueva radio-interaction-integration.mjs, Worker real importado con SQLite/D1 y KV aislados: correcta.
- Pedido público guardado, listado y actualización privados para Admin.
- Filtrado por emisora y persistencia de estado.
- Chat y respuesta guardados, rechazo de reply_to de otra emisora.
- Pedido pendiente de moderación ausente de bandeja; aparece tras aprobación.
No hubo mensajes ni solicitudes remotos.

## Falta funcional confirmada en esta rama
El árbol del repositorio no contiene una página Radio Studio y el Worker actual no ofrece roles ni bandeja de operador por emisora. GET/PUT radio/requests requieren Admin. No corresponde entregar credenciales centrales a emisoras. La existencia de inscripción/aprobación de señales no equivale a un panel de operador implementado.

Para la demo administrada por UADAV, los pedidos pueden revisarse desde Admin; no debe anunciarse autoservicio Radio Studio. El cierre del panel de operadores requiere una implementación separada con:
1. Vinculación verificada de cuenta a una emisora; sin conceder acceso sólo por conocer su ID.
2. Sesión de cuenta existente y permiso revocable de operador.
3. Endpoints filtrados obligatoriamente por emisora autorizada y estados permitidos.
4. Interfaz de bandeja, estados y respuestas mediante la aplicación.
5. Auditoría y pruebas de denegación cruzada entre emisoras y Admin.
El alta o concesión de permisos reales requiere autorización; las pruebas usarán identidades aisladas.

## Otros riesgos abiertos
La ruta administrativa PUT actual no valida una lista cerrada de estados ni exige que el pedido exista antes de responder success. El fallback KV de listado no aplica el filtro radio_id cuando D1 no está disponible. No se consideran arreglados por las pruebas de funcionamiento normal.
La escritura KV seguida de safeD1 no garantiza atomicidad entre almacenes. El guardado por formulario evita duplicados simultáneos de ese formulario; no hay idempotencia distribuida de pedidos.
Reparaciones de Worker deben probarse y desplegarse únicamente en staging antes de producción.
