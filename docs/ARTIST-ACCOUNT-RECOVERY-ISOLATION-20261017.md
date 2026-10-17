# Recuperación de artista aislada por cuenta — 17/10/2026

La recuperación automática se comparte sólo entre operaciones de la misma cuenta y el mismo acceso guardado. Un contexto distinto inicia su propia operación. El cierre de una operación anterior no borra la nueva. Los fallos temporales se conservan 30 segundos para evitar intentos continuos; Volver a comprobar permite el reintento explícito. Las denegaciones 401/403 no se reintentan automáticamente con el mismo acceso. Cambiar el acceso permite una comprobación nueva.

Recuperar automáticamente el vínculo no genera una sesión privada redundante: restore renueva una sola vez al resolver el artista final; las tarjetas pueden esperar a que el usuario abra su espacio. La respuesta debe conservar cuenta, token y ausencia de otro artista seleccionado antes de aceptarse.

El formulario Recuperar un acceso anterior bloquea el doble envío y el campo secreto mientras procesa, conserva su valor ante error y no renueva ni limpia el campo si cambió la cuenta o se retiró el formulario. Se elimina la instrucción de generar otro enlace por un fallo de conexión. Los errores se muestran en lenguaje simple.

54 pruebas locales satisfactorias, incluidas siete nuevas con módulo completo: vinculación compartida, dos cuentas simultáneas, error temporal/espera controlada, acceso nuevo tras denegación, doble envío manual, cambio de cuenta y fallo manual. Integración real cliente → Worker → SQLite/KV aislados ampliada: una invitación aprobada ficticia recupera su vínculo y abre exactamente el artista esperado con un POST de vinculación y un POST de sesión. Sólo datos locales; no se aprobaron propiedades remotas ni se enviaron mensajes reales.

CI final satisfactorio sobre b7963aaa2665fd65a72b8fa48687fec2459e2e94: Platform integration checks (run 39074264574) y Job status contract checks (run 39074264652). La lectura HTTP de /usuario en staging devuelve el recurso uadav-artist-account-v142.js?v=20261017-recovery-isolated. Esto verifica entrega del HTML, no una sesión de propietario. Pendiente: uso con propietario autenticado en navegador. Se conservan las pruebas anteriores de publicación, permisos y revocación. Producción, Worker desplegado, pagos y secretos sin cambios.

## Conservación de la selección durante restore

Se conserva la cuenta, el artista seleccionado y el parámetro artist_id al comenzar la restauración. Antes de solicitar y antes de guardar la sesión se comprueba que no haya una selección posterior distinta. Dos restauraciones del mismo artista siguen siendo compatibles. Una respuesta lenta no reemplaza el acceso guardado de otro artista elegido después.

56 pruebas locales satisfactorias (dos regresiones nuevas sobre selección tardía y selección sin cambios), sintaxis correcta e integración cliente → Worker → SQLite/KV satisfactoria. Referencia del módulo actualizada a 20261017-restore-selection en las tres páginas consumidoras. CI satisfactorio sobre 8137ba0736455e4582d04eaf3d9aa78482b63e8a: Platform integration checks (39075493780) y Job status contract checks (39075493808). La última lectura HTTP de staging aún entregaba recovery-isolated: la entrega de restore-selection queda pendiente de confirmación. Sin pruebas nuevas de propietario en navegador ni modificaciones de producción/pagos.
