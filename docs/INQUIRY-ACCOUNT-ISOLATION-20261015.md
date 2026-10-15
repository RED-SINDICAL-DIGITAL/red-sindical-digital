# Consultas privadas y cambio de cuenta

Fecha UTC 15/10/2026; Argentina 14/10/2026.

Se verificaron con éxito artist-inquiries-integration.mjs y booking-form-retry.test.cjs: entrega al artista, acceso exclusivo del destinatario, notificaciones, persistencia de estados, solicitudes simultáneas, compatibilidad con registros antiguos e idempotencia del formulario.

Se reforzó la bandeja para comprobar la cuenta antes de solicitar y después de interpretar JSON. Al cambiar la cuenta por evento local o storage, se eliminan de la vista las consultas anteriores. La protección no modifica ni borra registros del servidor. Se evita renderizar resultados bajo otra cuenta. Los listeners se desactivan si reciben un evento cuando su vista ya no está conectada.

Prueba nueva: node --test tests/artist-inquiry-account.test.cjs. Tres casos pasan: respuesta tardía descartada y datos previos retirados, evento de cambio vacía bandeja sin red, misma cuenta conserva la respuesta. Sintaxis verificada. Esta prueba nueva requiere incorporarse al listado CI si el flujo usa enumeración explícita; por ahora se ejecutó localmente. Falta inspección visual desplegada de la bandeja y prueba real con dos cuentas vinculadas. No se envió ninguna consulta a artistas reales ni se modificó producción.
