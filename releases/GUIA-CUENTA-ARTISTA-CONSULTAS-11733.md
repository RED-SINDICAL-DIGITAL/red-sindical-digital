# Mi cuenta, mi artista y consultas · Worker 11733 / interfaz 12019

## Qué se corrigió
El formulario Consultar contratación guardaba solicitudes en el registro Contrataciones, accesible desde Admin, sin una bandeja privada para el artista. Ahora Consultas recibidas muestra las solicitudes dirigidas a su ID, incluidas las anteriores que sigan guardadas. Esta función es gratuita y no depende de PRO.

El artista puede ver quién consulta, evento, fecha, ciudad, presupuesto informado, detalles, email y WhatsApp. Puede abrir su aplicación de email para responder y marcar Nueva, Leída, Respondida o Cerrada. Cambiar estado no envía mensajes. Una consulta no confirma un contrato, reserva, presupuesto aceptado ni pago.

Admin → Solicitudes y comunidad → Consultas de contratación muestra las mismas solicitudes y sus estados, con búsqueda, detalle y carga progresiva. Los pedidos del Marketplace tienen una tabla separada. Cada cambio de estado se guarda en D1 por solicitud; no reescribe ni elimina las consultas de otros artistas. El formulario muestra el número de referencia y evita envíos dobles mientras espera la respuesta. Al alcanzar la capacidad existente no elimina solicitudes anteriores: rechaza nuevas solicitudes con un aviso.

## Vinculación cuenta–artista
1. Desplegar el Worker 11733, manteniendo KV y D1 y las claves actuales. Verificar /api/health: build 11733.
2. Activar o vincular tu cuenta desde Mi perfil / Mi cuenta. Si ya está sincronizada, conservarla.
3. Abrir el enlace privado del artista y pulsar Vincular a Mi cuenta.
4. Volver a Mi cuenta: aparecerá Abrir mi perfil de artista.
5. En otro dispositivo, vincular esa misma cuenta con el QR/código y abrir el artista desde Mi cuenta.
6. Consultas recibidas reúne las solicitudes gratuitas. Press Kit y herramientas mantiene sus herramientas PRO. Perfil y Contenido son las opciones principales; Plan y más opciones agrupa las secundarias.

No hay claves privadas en enlaces públicos ni en el contenido sincronizado de la biblioteca. D1 guarda la relación entre cuenta, artista, reclamo y vencimiento. Cada dispositivo obtiene un permiso temporal; se verifica nuevamente al usarlo. Revocar el dispositivo, desvincular el artista o cambiar el propietario invalida ese acceso. El vínculo no prolonga el vencimiento del permiso original. Si vence, debe renovarse el acceso legítimo. Recuperar la cuenta conserva sus relaciones, mientras sus permisos continúen vigentes.

## Datos y despliegue
No se borran perfiles, borradores, consultas ni herramientas. El Worker crea de manera idempotente audience_artist_links y artist_inquiry_states en el D1 existente. No necesita nuevas variables ni proveedores pagos. Se mantienen la biblioteca y la vinculación de dispositivos existentes.

La interfaz funciona con el Worker anterior, pero vincular artistas y abrir consultas necesita 11733. Si falta, muestra un aviso de actualización. El acceso privado original continúa funcionando.

## Pruebas y límites
Pruebas con SQLite real: vínculo mediante credencial válida, separación entre cuentas, propietario vigente, dispositivos revocados, desvinculación, rotación de recuperación, sesiones temporales, consultas antiguas, acceso gratuito, IDOR de consultas y cambios de estado permitidos. Regresiones: sincronización/QR, perfiles, contenido, Press Kit, PRO, módulos Admin y Turnstile.
La demostración visual usa datos ficticios y no hace llamadas a la bandeja real. No se verificó la solicitud concreta de producción ni se vinculó un artista real a una cuenta: esas comprobaciones quedan para después del despliegue y con su sesión autenticada. No se envían emails ni notificaciones Web Push automáticamente.
