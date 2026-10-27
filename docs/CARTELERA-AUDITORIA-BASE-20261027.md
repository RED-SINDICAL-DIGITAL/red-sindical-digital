# Cartelera · auditoría previa · 27/10/2026 Argentina

La entrega11769 de Bolsa/cuenta ya está desplegada según health y el acceso por correo está habilitado con las dos pruebas QA registradas. El operador indicó «hecho todo»; el informe seguro privado ya fue recibido y cotejado:14/14fases,rollback y contexto restaurado, sin repetir los pasos ya completados. No se declara cerrada toda Bolsa: la prueba de convocatoria externa real elegible sigue aparte. Se avanza con esta lectura y reproducción aislada de Cartelera, sin cambiar su implementación o publicar eventos remotos.

## Estado previo conservado

La publicación común es gratuita. Solicitar un destacado no implica pago ni activa su posición comercial. Existe moderación configurable, ficha pública, filtros, funciones múltiples y navegación de regreso. La demo sintética de escritorio del19/10 ya tiene evidencia en `DEMO-EVENT-LIVE-ACCEPTANCE-20261019.md`; no se vuelve a publicar ese evento. Pagos, Ticket y producción no se activan.

La regresión actual de Pages aprobó33pruebas de formulario, identidad de ficha, filtros y errores de carga, además del script de slider/hero. Son una base útil, pero no cubren todos los fallos de persistencia del servidor.

## Hallazgos reproducidos en memoria

Comando desde la raíz Worker: `node scripts/audit-cartelera-baseline.mjs`. Usa el Worker real del checkout, SQLite/D1 modelado y KV en memoria, con fetch remoto prohibido. Los correos son ficticios `.invalid`; no crea registros o envía mensajes en staging. Evidencia: `evidence/cartelera-auditoria-base-20261027.json`.

| Caso | Resultado actual | Consecuencia |
|---|---|---|
| Repetir exactamente el POST, incluido el mismo request_id | Dos respuestas200, distintos identificadores y dos copias visibles. | Perder la primera respuesta y reintentar puede duplicar un evento. El bloqueo del botón solo protege la pestaña durante el envío. |
| Interrumpir la escritura de `cartelera_aprobada` después de guardar `eventos_publicados` | Excepción sin respuesta controlada; queda1publicación y0fichas de catálogo. Reintentar deja2publicaciones y1ficha. | Las colecciones KV no son una transacción; un error puede dejar datos parciales y un registro huérfano. |
| Publicar fecha2026-02-30 con la función en esa misma fecha | Respuesta200/success. | El servidor admite un día inexistente aunque el calendario del navegador impida seleccionarlo. |

Los hallazgos corresponden a código Worker `bc3e4470b5f0a3a5d823516013fa46328d67a936`, misma implementación operativa11769. No se ensayan estos POST en la nube. Los resultados del harness son diagnóstico del comportamiento actual, no casos que deban perpetuarse al corregirlo.

## Orden de corrección

1. Validar fecha calendario y hora en el servidor, incluida cada función, sin cambiar fechas históricas guardadas o descartar funciones silenciosamente. Mantener mensajes comprensibles y los datos del formulario ante un rechazo.
2. Añadir intención de publicación idempotente, con identificador estable guardado antes del primer envío y reutilizado tras una respuesta incierta. Cubrir también la cola de moderación. Un mismo identificador con contenido distinto debe dar conflicto.
3. Definir una fuente de verdad transaccional para evento/intención/estado y una proyección recuperable. No prometer atomicidad entre dos escrituras KV o entre D1 y KV. Conservar los registros existentes, fechas/funciones, autoridad artística y la separación entre publicación común y destacado comercial.
4. Probar respuesta perdida, dos dispositivos, concurrencia y fallos entre pasos. Revalidar permisos al confirmar la escritura y evitar notificaciones dobles. Después, validar el recorrido en staging y PC/celular con datos ficticios identificados.

Esta auditoría no instala migraciones ni despliega una versión nueva. La corrección se preparará como entrega propia en las dos ramas existentes, con código, pruebas y despliegue claramente diferenciados. La auditoría no mezcla ramas, modifica producción o cambia las decisiones comerciales.
