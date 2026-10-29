# Worker integrado: recuperación acotada y vencimientos — 29/10/2026

## Incluido

- Motor embebido con selección de envío por oferta y solicitud.
- La reserva de correo del circuito QA pasa ambos identificadores. No cambia el límite de una reserva ni permite reenvío tras resultado incierto.
- Incluye corrección previa de vencimiento en el límite exacto, conservando la ficha gratuita.
- Suite completa: 443 pruebas aprobadas. La nueva integración prueba selección SQL con ambos identificadores, envío de una sola oferta, canje y estado completo.

## Despliegue

Solo reemplazar código de `uadav-api-staging`, conservando bindings, secrets y variables actuales. Archivo: `releases/worker-UADAVSTREAM-V11.7-11770-recovery-scoped.js`. No usar `uadav-api` ni los Workers de laboratorio/restauración. No agregar variables ni migraciones.

No se desplegó desde esta sesión. Después corresponde comprobar circuito QA real y vencimiento remoto. La build sigue 11770; `/health` por sí solo no distingue este archivo: verificar también el hash del archivo desplegado.

## Recuperación real pendiente

Los recorridos actuales de Mi Perfil con identidad verificada siguen disponibles. La recuperación de claves de ofertas reales continúa deshabilitada; no se debe convertir automáticamente el correo de contacto de ofertas antiguas en una identidad verificada. Requiere una habilitación propia por oferta con prueba de autoridad, receptor compatible, control global de correos y prueba real completa en staging. Esta integración no constituye esa habilitación.

Producción intacta.

SHA256 del candidato: `46246354a6fb8e436106dc2cb6b5d23c9858a45ef2562be8c9795f28bd13dbd8`.
