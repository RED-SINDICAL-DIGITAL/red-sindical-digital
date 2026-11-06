# Beta: cierre funcional, pasada 1

Entorno exclusivo: staging. Producción sin cambios. Modelo: perfiles/eventos/Bolsa gratuitos; contratación y pago directos entre productor y artista; publicidad cotizada por administración. Sin nuevas membresías.

## Correcciones publicadas en esta pasada
- Alta pública: quitada la referencia a PRO como plan opcional.
- Para artistas: retirada oferta USD 3,99 mensual / USD 30 anual y sus cupos de promoción.
- Promoción: retirado tarifario fijo anterior de Cartelera y Hero; consulta a administración.
- Manual público/interno: eliminadas indicaciones de comprar PRO; explicados Postimages, vista previa y Hero público gratuito de Cartelera.
- No se modifica el historial de pedidos, pagos ni permisos históricos.

## Evidencia
- 699 comprobaciones de las suites node --test declaradas en workflows: aprobadas antes y después de la limpieza. No equivale a ejecutar todos los pasos de todos los workflows.
- 41 pruebas aisladas del Worker: almacenamiento laboral, postulaciones, vínculo de cuenta, vencimiento, migración, publicación de eventos, contratación privada y consultas publicitarias.
- 106 comprobaciones dirigidas de frontend (subconjunto parcialmente solapado con las anteriores): aprobadas.
- 5 pruebas de recuperación de presentación, en la rama frontend actual: aprobadas.
- Build de frontend staging: 201 archivos, API staging, sin despliegue manual ni recursos nuevos.
- Prueba real anterior de contratación directa: artista QA publicado por Admin, propuesta recibida en privado sin derivación sindical; estado Leída persistente tras actualizar. Referencia CON-bfe7e806d521d454694f1715a72310cd9753e2c371f746542ed0a685120eedfa. No se envió correo ni realizó pago.

## Pendientes para declarar la beta lista
1. Revisar después del despliegue frontend estas páginas y coherencia en celular/PC.
2. Pruebas reales completas de oferta/postulación y evento con imagen, edición y banner; no repetir publicación con datos reales durante QA.
3. Recuperación de cuenta por correo y vínculo de dispositivo de extremo a extremo. Los scripts HTTP requieren URL/credenciales de QA: su ejecución sin parámetros no cuenta como fallo del producto ni como validación.
4. Campaña comercial completa en staging: selección de provincia, entrega correcta, confirmación administrativa, bonificación y vencimiento. Las pruebas aisladas no sustituyen esta comprobación.
5. Cierre visual y de reproducción (pasada 2), respaldo/recuperación y paquete final (pasada 3).
6. VDO.Ninja experimental; recepción entre teléfonos, gorra y límites reales pendientes. Postimages: carga manual por enlace; integración automática pendiente del proveedor.

No requiere nuevo Worker por estas correcciones: son páginas, manual y documentación. El Worker existente de staging conserva las pruebas aprobadas. Los datos QA se conservan identificados hasta el cierre; no se borran datos reales.
