# Estados de consultas — 17/10/2026

Se protege el cambio de estado del Admin contra doble envío por referencia de consulta. La acción transporta el identificador visto en el modal y comprueba que el índice todavía corresponda a esa referencia. Si la lista cambió, pide reabrir la consulta. Sólo admite los estados usados por cerrar/reabrir en esta pantalla.

Mientras se guarda se deshabilita la acción y se informa el progreso dentro del modal. Ante fallo se conserva la caché previa y un mensaje persistente; no hay reintentos automáticos. Una respuesta tardía no cierra un nuevo modal ni navega desde otra sección. El Worker, los permisos y las notificaciones no se modifican.

Siete pruebas del manejador real verifican cancelación, doble envío, fallo y reintento explícito, índice obsoleto, modal diferente, cambio de sección y estados no admitidos/editor ausente. Con las demás pruebas de Admin: 28 satisfactorias antes del ajuste del aviso de índice; las siete del manejador se repitieron correctamente después del ajuste.

Pendiente: resultado de CI, verificación en Pages y ciclo de cierre/reapertura de una consulta sintética. No se ha probado la sincronización visual en una sesión del artista en este incremento. El control frontend no sustituye una revisión condicional de estados en backend frente a operadores simultáneos.
