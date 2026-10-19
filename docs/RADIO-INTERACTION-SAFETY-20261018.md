# Radio: chat y pedidos — 18/10/2026

Se serializa cada formulario de forma independiente, se bloquean sus campos durante el envío y se restaura su estado previo al terminar. Las respuestas incompletas no borran el texto ni la referencia de respuesta. La moderación pendiente tiene mensaje propio. Una respuesta tardía no limpia una pantalla separada o perteneciente a otra emisora. Los POST no se repiten contra otra API ante fallos; GET conserva fallback configurado.

6 pruebas del script real satisfactorias, incorporadas a GitHub Actions. No se enviaron mensajes ni pedidos remotos. La protección cliente no constituye idempotencia del servidor entre dispositivos ni garantiza entrega tras reintento manual de resultado incierto.

Inspección Worker: pedidos se guardan en radio_requests KV y D1 mediante safeD1; listado GET requiere Admin, actualización PUT requiere Admin. Chat se guarda en community_messages con respuesta validada contra el mismo stream. Esto no certifica el circuito del operador de Radio Studio: sigue pendiente comprobar su bandeja y permisos específicos sin acceso al Admin central. No se promete reproducción del tema pedido ni notificación externa. La interfaz lo aclara.

Sin cambios en Worker, producción o pagos. Requiere prueba de formularios desplegados y circuito real con operador autorizado.
