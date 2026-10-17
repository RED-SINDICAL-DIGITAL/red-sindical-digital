# Recuperación de artista aislada por cuenta — 17/10/2026

La recuperación automática se comparte sólo entre operaciones de la misma cuenta y el mismo acceso guardado. Un contexto distinto inicia su propia operación. El cierre de una operación anterior no borra la nueva. Los fallos temporales se conservan 30 segundos para evitar intentos continuos; Volver a comprobar permite el reintento explícito. Las denegaciones 401/403 no se reintentan automáticamente con el mismo acceso. Cambiar el acceso permite una comprobación nueva.

Recuperar automáticamente el vínculo no genera una sesión privada redundante: restore renueva una sola vez al resolver el artista final; las tarjetas pueden esperar a que el usuario abra su espacio. La respuesta debe conservar cuenta, token y ausencia de otro artista seleccionado antes de aceptarse.

El formulario Recuperar un acceso anterior bloquea el doble envío y el campo secreto mientras procesa, conserva su valor ante error y no renueva ni limpia el campo si cambió la cuenta o se retiró el formulario. Se elimina la instrucción de generar otro enlace por un fallo de conexión. Los errores se muestran en lenguaje simple.

54 pruebas locales satisfactorias, incluidas siete nuevas con módulo completo: vinculación compartida, dos cuentas simultáneas, error temporal/espera controlada, acceso nuevo tras denegación, doble envío manual, cambio de cuenta y fallo manual. Integración real cliente → Worker → SQLite/KV aislados ampliada: una invitación aprobada ficticia recupera su vínculo y abre exactamente el artista esperado con un POST de vinculación y un POST de sesión. Sólo datos locales; no se aprobaron propiedades remotas ni se enviaron mensajes reales.

Pendiente: CI final, entrega del nuevo recurso en staging y uso con propietario autenticado en navegador. Se conservan las pruebas anteriores de publicación, permisos y revocación. Producción, Worker desplegado, pagos y secretos sin cambios.
