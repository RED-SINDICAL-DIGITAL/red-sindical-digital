# Publicación inmediata de Cartelera — staging

Preparado el 29/10/2026. No desplegado por el agente. Producción sin cambios.

## Causa y cambio
El interceptor general de moderación retenía eventos antes de llegar al circuito atómico. La nueva opción CARTELERA_PUBLICATION_STAGING=immediate permite publicar sin revisión previa exclusivamente en uadav-api-staging.uadavstream.workers.dev con EVENT_ATOMIC_STAGING=true. No cambia Radio, chat, perfiles ni producción. Conserva validación, límites de admisión D1 y deduplicación; los destacados permanecen pendientes de revisión y sin pago confirmado. Solicitudes anteriormente pendientes o rechazadas siguen bajo su decisión previa, evitando republicarlas automáticamente.

## Pruebas
428/428 tests *.test.mjs aprobados. Incluye publicación sin proveedor IA, repetición de referencia, conflicto de datos, destacado no pagado, límite de envíos y aislamiento por hostname. No se enviaron correos reales ni se escribieron registros remotos.

## Despliegue manual
1. Cloudflare → Workers & Pages → uadav-api-staging → Edit code.
2. Copiar releases/worker-UADAVSTREAM-V11.7-11770.js completo y desplegar exclusivamente en ese Worker.
3. Settings → Variables and Secrets → agregar variable de texto CARTELERA_PUBLICATION_STAGING con valor immediate y desplegar. Conservar las demás opciones, bindings, cron y secretos.
4. GET /api/eventos/capabilities debe indicar publication_mode=immediate, atomic_publication=true, reference_required=true.
5. Probar un evento nuevo sintético, sin pago ni contacto de terceros: publicación pública inmediata, ficha accesible, referencia guardada, solicitud de destacado separada. Darlo de baja desde Admin al finalizar. Las solicitudes previamente pendientes no sirven para esta prueba.

Reversión: quitar CARTELERA_PUBLICATION_STAGING o darle otro valor. Vuelve el circuito previo de moderación; no elimina eventos existentes. No desactivar la moderación global.

## Pendientes honestos
Publicación real después de este despliegue; prueba de celular físico. Bolsa: los recorridos principales ya se probaron; la recuperación del código antiguo de una oferta sigue deshabilitada. La recuperación de cuenta por correo es un circuito distinto. No declarar cierre de producción ni activar avisos generales.

SHA256 Worker: 60cd4bbedabec8a393a0f54a223271bcc412c21433c5dd2462ae1bfb232715d0
