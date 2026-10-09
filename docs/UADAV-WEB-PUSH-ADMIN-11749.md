# Web Push y revisión Admin — Worker 11749 / frontend 12044

## Activación
1. Desplegar Worker 11749.
2. Admin → Mensajes a usuarios → Preparar Web Push. Genera una sola pareja VAPID en D1; la clave privada nunca sale en respuestas ni se publica en GitHub. No usar exportación general para publicar copias de esa tabla.
3. Cloudflare Worker → Triggers → Cron: */5 * * * * para procesar pendientes y reintentos automáticamente. Sin Cron se procesa el primer lote al publicar y se usa Procesar envíos pendientes para los restantes. Diez envíos por lote; cinco intentos como máximo. Servicios aceptan envíos; no equivale a confirmar lectura o entrega al teléfono.
4. Mi perfil → Configuración y dispositivos → Notificaciones en este dispositivo → Activar. Permiso voluntario por dispositivo. iOS/iPadOS compatible requiere instalación desde pantalla de inicio; no se probó en hardware real.
5. Admin → Mensajes a usuarios: título, mensaje, destinatario opcional, vigencia y Enviar también Web Push. Confirmar publicación. No se mandó ningún aviso real en las pruebas.

## Alcance
Web Push para mensajes enviados explícitamente por Admin. La campana conserva además consultas, estados PRO y vencimientos. No se conectaron automáticamente todos esos eventos al envío Web Push en este cambio. No se implementaron notificaciones privadas para el administrador al cerrar la aplicación.

## Seguridad y privacidad
Registro autenticado de suscripciones, endpoint HTTPS restringido a proveedores conocidos, sin redirecciones. ECDH/HKDF/AES-GCM RFC8291 y JWT VAPID RFC8292. Push genérico sin texto privado: abrir Mi perfil para leer. Suscripción ligada a permiso de dispositivo; revocado o cuenta eliminada no recibe nuevos envíos. DELETE desactiva permiso en servidor y el navegador se desuscribe. Claves estables, no rotación accidental.
Una notificación ya entregada no puede retirarse del teléfono al eliminar el aviso. La campana sí deja de mostrarlo. El SW tiene scope /uadav-push/ y no intercepta navegación ni reemplaza el service worker principal.

## Admin y perfiles
Pendientes incluye consultas nuevas de contratación además de perfiles, pagos, destacados y moderación. Cerrar consulta conserva el historial y actualiza el mismo estado del artista. Admin → Solicitudes → Ver consulta permite cerrar/reabrir. Creación de perfiles y eliminación tipificada existente preservadas. Pagos: rechazo conserva registro; la transferencia exige confirmación real. PRO y sincronización mantienen permisos actuales.

## Pendiente de validación operativa
Permiso/recepción/clic en Android, iOS instalado y PC; Cron y un envío real consentido. Auditoría visual exhaustiva de todos los módulos Admin y TV no completada. No se eliminaron módulos históricos sólo por su nombre.
