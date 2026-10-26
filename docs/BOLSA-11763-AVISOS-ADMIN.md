# Bolsa · avisos y consulta automática en Admin · 11763

## Estado de la entrega

Interfaz preparada y probada. El Worker principal 11763 todavía requiere despliegue manual; si el servicio anterior responde 404, se muestra una indicación de que la revisión automática no está disponible. La revisión manual se conserva.

## Uso para el equipo

En **Admin → Auditoría → Avisos por vencimiento de ofertas** se consulta el estado automático. **Actualizar estado automático** solo lee información: no activa tareas, cambia ofertas ni envía avisos. La consulta inicial se hace al abrir la sección; no hay un temporizador que envíe solicitudes indefinidamente.

Se distingue entre desactivada, pendiente de preparar, pausada, en curso o interrumpida. Si una ejecución se confirmó, se muestra su fecha en hora de Argentina y los conteos de ofertas actualizadas y avisos privados generados. Si falló, la pantalla lo indica sin presentar ese intento como éxito. Tener el modo habilitado no confirma por sí solo un evento de Cloudflare: debe existir una ejecución confirmada.

La revisión manual mantiene **Revisar vencimientos**, selección con máximo cinco avisos y confirmación expresa antes de **Enviar avisos revisados**. Tras un fallo o respuesta incierta se exige una nueva revisión; no se reenvía automáticamente desde el navegador.

Los avisos son privados para las cuentas que vincularon voluntariamente sus trabajos. El historial de candidaturas se conserva. La recuperación por correo sigue deshabilitada. La guía pública aclara que el vencimiento bloquea postulaciones aun cuando no se haya generado un aviso.

## Verificación

138 pruebas focalizadas UI aprobadas, incluidas cuatro pruebas nuevas del controlador de estado. La consulta solo admite el origen y API exactos de staging; valida el contrato del servidor, presenta texto escapado, ignora campos ajenos, serializa clics y descarta respuestas de vistas cerradas. Importación/exportación Admin aprobada. Las pruebas no certifican dispositivos físicos o la ejecución remota del cron.

El código Worker y la guía de despliegue permanecen en su rama `release/radio-studio-staging-rc-20261020`, documento `docs/BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md`. No mezclar las ramas. La activación remota se considera únicamente después de verificar health 11763 y el estado privado desde Admin.
