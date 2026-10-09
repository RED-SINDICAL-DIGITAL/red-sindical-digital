# UADAV STREAM · PRO y comunidad · 11741 / 12035

## Propuesta vigente
Perfil público, descubrimiento, publicación básica de eventos, Bolsa de Trabajo y contratación gratuitos para todos. También pueden presentarse técnicos, asistentes y otros trabajadores indicando su actividad. No se cobra comisión por trabajos conseguidos en la plataforma.

PRO: USD 3,99 mensual o USD 30 anual, cobrados en pesos según la cotización oficial vendedor y los importes configurados en Admin. La cuota sindical es independiente. Incluye presentación profesional compartible e imprimible, fichas de espectáculos, presupuestos, agenda, organización de consultas, convenios efectivamente disponibles y promoción mensual.

## Destacado incluido
- Mensual: un evento destacado durante siete días por período contratado.
- Anual: doce cupos distribuidos en períodos mensuales desde el inicio de la cobertura pagada.
- Un solo cupo habilitado por período; no se acumula ni se adelantan los siguientes.
- Se aplica a un evento publicado desde el espacio del artista y asociado por el servidor a ese artista.
- Se solicita en Mi espacio > Mi promoción. Admin revisa en Monetización > Destacados incluidos en PRO.
- Los siete días empiezan al aprobarlo. Una solicitud presentada durante el período puede aprobarse después sin descontar los días de espera.
- Rechazar devuelve el cupo si aún está dentro del período. Si el período ya venció, no pasa al siguiente.
- La publicación básica sigue siendo gratuita. Los destacados adicionales se pagan por separado.
- Transferencia informada no equivale a pago confirmado. Los cupos nacen de pagos aprobados, nunca de reportes pendientes.
- No garantiza cantidad de visitas, entradas vendidas ni contratación.

## Moderación de textos
Activada por defecto al desplegar 11741. Usa Groq si existe su clave; en otro caso Gemini. Admin puede seleccionar proveedor y limitar los análisis diarios (300 por defecto, máximo configurable 1000). Estas cuotas de la app no son una garantía del plan gratuito del proveedor.

Revisa textos de chats, pedidos de canciones, eventos, oportunidades de trabajo, cambios de perfil y publicaciones del Press Kit. No analiza imágenes, audio, videos externos ni derechos del catálogo. Tampoco confirma pagos ni sustituye la verificación de identidad. Las nuevas solicitudes de perfil siguen requiriendo su revisión de propietario.

Los contenidos claros se publican. Los señalados, las respuestas inválidas del proveedor, los errores, la falta de clave o el agotamiento de cuota quedan pendientes. Admin > Moderación permite ver, rechazar o aprobar y publicar. Los cambios de perfil y de presentación se aplican sólo si el propietario y la versión siguen siendo válidos.

Presupuestos, clientes, notas de pagos y agenda privados no se envían a la IA. Del Press Kit sólo se analiza la presentación destinada a publicarse. Tokens y claves no se guardan en la cola ni se envían al modelo.

## Radio e interacción
Chat centralizado en D1, historial público de los últimos 100 mensajes dentro de treinta días, hasta 1000 mensajes retenidos por sala. Se permiten respuestas a mensajes de la misma sala. El contenido pendiente no se muestra públicamente. Se importa el historial anterior que todavía exista en KV; lo que ya venció no se puede recuperar.

Los pedidos se registran en UADAV STREAM identificados por emisora y hoy los gestiona Admin. No se envían automáticamente a Zeno ni garantizan la reproducción de la canción. Queda pendiente la bandeja delegada del responsable de radio: verificar titular, vincular emisora a Mi perfil y limitar la lectura/respuesta a su propia emisora. No se debe entregar acceso general al Admin.

La futura comunidad debe priorizar seguir, guardar, responder y consultar; evitar chats privados entre desconocidos o una red social completa antes de cerrar permisos y bandejas. En vivo debería usar una sala por transmisión, dentro de la app.

## Inicio
index.html deja de cargar el sitio antiguo antes de redirigir. Sólo comprueba el modo de portada y abre el shell vigente; si está embebido abre directamente el inicio, evitando shells anidados. Se conserva el modo promocional. No se modificó el diseño completo del inicio.

## Despliegue y verificación
Frontend 12035; Worker acumulativo 11741. Tras desplegar, probar Admin > Moderación > Probar conexión y clasificación. Si el proveedor no responde, la prueba lo informa y los contenidos continúan pendientes. La integración se probó con respuestas simuladas de proveedores y SQL real; la respuesta del proveedor de producción requiere esa prueba tras desplegar.
