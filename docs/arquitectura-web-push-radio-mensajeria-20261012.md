# Web Push, En vivo y mensajería de Radio — auditoría y contrato
Fecha: 2026-10-12. Estado: especificación tras inspección de Worker, admin.html y radio.html; no desplegado ni probado extremo a extremo.

## Inventario confirmado
- Worker contiene utilidades Web Push (VAPID, cifrado, tablas D1 audience_push_settings, audience_push_subscriptions y entregas); comprobar rutas exactas, permisos, clientes y Service Worker antes de prometer activación.
- radio.html ya usa GET chat?id_stream=radio:<id>, POST moderar_chat y POST radio/requests.
- admin.html ya consulta radio/requests y presenta pestaña de pedidos con emisora, oyente, pedido, dedicatoria, estado, fecha y acciones.
- Worker almacena mensajes comunitarios en D1 community_messages, con stream para separar conversaciones. Verificar políticas de retención, moderación, autenticación y abuso.
- service-worker.js existe pero no se ha confirmado que maneje push y notificationclick; evitar instalar un segundo SW que rompa la PWA.

## Comportamiento solicitado
1. **Web Push configurable** desde Admin: habilitar/deshabilitar globalmente, crear campañas manuales, plantillas, prioridad, territorio, horarios, caducidad, previsualización, prueba interna y estadísticas de entrega.
2. **Eventos automáticos**: artista verificado inicia directo, programa especial, radio, estreno, cartelera. Solo notificar eventos realmente confirmados, con deduplicación, límite por frecuencia y opt-in.
3. **Preferencias de audiencia**: categorías (artistas seguidos, directos, radio, especiales, eventos territoriales, comunicados); consentimiento expreso y revocable, no suscripción silenciosa. Preferencias y suscripciones asociadas a cuenta o token seguro.
4. **Plataformas**: Web Push para navegadores/PWA compatibles, incluso móvil si está instalada cuando el sistema lo requiera. Smart TV: mostrar avisos dentro de la app, no prometer Web Push del navegador de TV. Mensajería interna como respaldo para usuarios sin permiso push.
5. **Deep links**: abrir el directo, artista, radio, episodio o evento correcto al tocar la notificación. No mandar enlaces externos arbitrarios.
6. **Roles**: Admin general puede enviar campañas; artistas verificados y responsables de emisora solo avisos limitados a sus seguidores/propia señal, con control de abuso y posibilidad de revocar.
7. **Radio**: pedidos musicales llegan a la bandeja de la emisora, visible para Admin y responsables delegados, con estados pendiente/en curso/atendido/rechazado y aviso opcional. Chat público separado por emisora, con respuesta, moderación, bloqueo y límites antispam. Mensajes privados de contacto/contratación no se mezclan con chat público ni pedidos.
8. **Privacidad y seguridad**: no incluir datos personales de pedidos en notificaciones push; retención limitada, consentimiento, bajas, segmentación territorial no invasiva; auditar accesos y envíos.

## Plan de implementación y QA
- Verificar rutas push ya implementadas, sus restricciones de acceso, Service Worker existente y D1 migrations. No regenerar VAPID ni duplicar tablas.
- Agregar controles faltantes en Admin reutilizando API existente, luego preferencias de usuario y eventos automáticos con idempotencia.
- Verificar extremo a extremo: permiso, suscripción, envío, recepción en primer plano y segundo plano, click/deep link, revocación, límites, radio requests, chat y roles.
- Probar PC, Android, iOS PWA cuando aplique, tablet y avisos internos Smart TV. Sin declarar funcionalidad productiva antes de pruebas reales.
