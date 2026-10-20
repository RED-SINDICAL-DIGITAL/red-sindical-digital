# Radio Studio — automatización segura (staging)

## Comprobado en pruebas reales
- Alta, revocación y restablecimiento de operador autorizado a una sola emisora.
- Pedido público -> moderación manual -> D1 -> Radio Studio -> En cola -> Sonó.
- Chat público -> moderación manual -> Studio -> respuesta -> moderación -> chat público.
- Cuenta sin credenciales no obtiene bandejas.

## Implementado en esta rama aislada
- Acciones para el estado actual deshabilitadas; estados finales played y rejected sin botones operables.
- Restricción atómica de PATCH en D1 para evitar actualizar pedidos finales o aplicar transiciones redundantes, con respuesta 409.
- Acceso a Mi Perfil visible cuando no hay cuenta vinculada.

## Automatizaciones siguientes (NO implementadas)
1. **Moderación local por emisora:** cola dedicada; verificar en servidor identidad de operador, grant activo y radio_id del payload, y exigir pertenencia a scope de radio antes de aprobar/rechazar. Sin acceso a moderación de eventos, artistas u otras emisoras.
2. **Antispam sin proveedor IA:** límites por IP/ventana, deduplicación de contenido, longitud, enlaces inseguros, enfriamiento y revisión manual de casos dudosos. No publicar automáticamente contenido potencialmente abusivo. Disponer de fallbacks comprobables si proveedor externo está ausente.
3. **Notificaciones de operador:** contador de pedidos y chat pendientes, refresco incremental con intervalo moderado y pausa al ocultar pestaña; Web Push opcional y con consentimiento.
4. **Auditoría y coherencia:** registro de actor, emisora, pedido, estado anterior/nuevo y fecha; respuestas de error claras. Reintento idempotente de escritura auxiliar en KV sin doble pedido.
5. **Interfaz:** filtros claros, etiqueta del estado actual, estado vacío útil, acciones adecuadas por estado, foco accesible, navegación celular/tablet.

## Condiciones de aceptación
- Verificar con dos cuentas y dos emisoras; impedir GET, PATCH y POST de otra emisora, también luego de revocar permiso y sin refrescar UI.
- Comprobar moderación manual, errores 409 y 503, y no duplicación ante reintentos.
- No activar pagos, emisión automática de música, ni cambiar bindings de producción.
- Todo despliegue a staging requiere revisión y autorización explícita; la rama automática de Pages permanece inalterada.
