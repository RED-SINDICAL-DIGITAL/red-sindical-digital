# Estados de consultas — 17/10/2026

Se protege el cambio de estado del Admin contra doble envío por referencia de consulta. La acción transporta el identificador visto en el modal y comprueba que el índice todavía corresponda a esa referencia. Si la lista cambió, pide reabrir la consulta. Sólo admite los estados usados por cerrar/reabrir en esta pantalla.

Mientras se guarda se deshabilita la acción y se informa el progreso dentro del modal. Ante fallo se conserva la caché previa y un mensaje persistente; no hay reintentos automáticos. Una respuesta tardía no cierra un nuevo modal ni navega desde otra sección. El Worker, los permisos y las notificaciones no se modifican.

Siete pruebas del manejador real verifican cancelación, doble envío, fallo y reintento explícito, índice obsoleto, modal diferente, cambio de sección y estados no admitidos/editor ausente. Con las demás pruebas de Admin: 28 satisfactorias antes del ajuste del aviso de índice; las siete del manejador se repitieron correctamente después del ajuste.

Pendiente: resultado de CI, verificación en Pages y ciclo de cierre/reapertura de una consulta sintética. No se ha probado la sincronización visual en una sesión del artista en este incremento. El control frontend no sustituye una revisión condicional de estados en backend frente a operadores simultáneos.

## Ciclo real comprobado en staging

Consulta sintética CON-0fe1652283a3a3f956ec9b876559acdb0d16b77b552f29bb25a30bb36ece4852, dirigida a QA PRO INTEGRAL 1510. Desde su estado Nueva, se confirmó cerrar: la UI mostró progreso y botón deshabilitado; luego la bandeja y el detalle mostraron Cerrada. Se confirmó Reabrir consulta y se comprobó Nueva en el listado recargado y en el detalle reabierto. El estado funcional inicial quedó restaurado; las fechas/registros internos de estas operaciones pueden haber cambiado. No hubo mensajes externos, contratación, pago, afiliación ni cambio de PRO. No se alteró la otra consulta Leída.

GitHub Actions del commit 1c1650efd1cdd825e188fe3c128e0573b0c54695: Platform integration checks 685 y Job status contract checks 326 satisfactorios. Sintaxis inline del Admin verificada. Quedan sin probar la pérdida de conexión en navegador, las escrituras simultáneas de dos operadores y la sincronización visual desde la cuenta del artista.
