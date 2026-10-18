# Worker: pedidos de Radio — 18/10/2026

Worker commit: c2b6ce1f4f8f22a21643219ef3cbc3da62046c16.
Blob: 14b2305ecfe71afc978e4fcdc90da64fab852a5d.

## Cambios
- GET radio/requests mantiene el filtro radio_id al recurrir a KV tras fallo D1.
- PUT exige identificador no vacío y estado de lista cerrada: pending, queued, played, rejected. Se conserva done como compatibilidad.
- Pedido inexistente: 404. Estado/ID inválido: 400.
- Si falta en KV, comprueba D1; si no puede comprobarlo devuelve 503 en lugar de inventar éxito o inexistencia.
- Se conserva un timestamp por actualización. No cambia autenticación Admin ni concede roles nuevos.

## Validación aislada
radio-interaction-integration.mjs satisfactorio: estados válidos, estado arbitrario, ID ausente/inexistente, filtro KV con caída D1 simulada, registro sólo D1, bandeja privada, chat por emisora y moderación.
Sintaxis Worker y regresiones de Cartelera, Bolsa, consultas de artista y privacidad del Press Kit: satisfactorias.

## Despliegue pendiente
El Worker no se despliega por actualizar Pages. Esta versión sólo está en la rama de auditoría y debe desplegarse al Worker uadav-api-staging con sus D1/KV aislados, sin cambiar bindings de producción ni secretos.
El build público 11753 por sí solo no identifica esta corrección: se requiere registrar la versión desplegada y repetir el circuito remoto antes de cerrarlo.
No se ha desplegado en staging o producción durante esta tarea.

## Límites
safeD1 sigue sin garantizar transacción distribuida con KV; un fallo de sincronización posterior a una escritura permanece como riesgo a conciliar. No hay idempotencia entre dispositivos ni Radio Studio para operadores. No se modificaron pagos.
