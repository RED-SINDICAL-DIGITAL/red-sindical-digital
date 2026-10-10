# Revisión Admin y Worker — build 11752 / sitio 12053

## Admin
- Importar / exportar ahora tiene una vista real conectada al menú.
- CSV y Excel usan las mismas fuentes. Los campos anidados se conservan como JSON y las celdas que podrían ejecutar fórmulas se neutralizan.
- JSON requiere tipo indicado; cambiar archivo u opciones invalida la vista previa. Cada lote se revisa y confirma; los fallidos quedan disponibles para reintentar.
- Los estados de derechos que descarga el botón corresponden a lo informado en perfiles de artistas, no a una confirmación ante SADAIC, AADI o CAPIF.
- Las campañas activas requieren pago registrado o bonificación, y fechas válidas.
- El contador “Pendientes” usa las mismas bandejas y estados que Admin → Pendientes. Las solicitudes de destaque de Cartelera se incorporaron a la bandeja: el evento permanece publicado y sólo se aprueba o rechaza su espacio premium. Si alguna bandeja no responde, se indica cuál y el total se marca como incompleto.

## Worker 11752
- Rechaza activar campañas sin pago/bonificación, sin fechas o con un fin anterior al inicio.
- El endpoint público sólo entrega campañas pagas, activas y dentro del período, incluyendo todo el día de finalización.
- Derechos exportados filtran el mes, neutralizan fórmulas en CSV y agregan BOM para Excel.
- No modifica campañas, pagos ni estados guardados existentes.

## Despliegue
- Sitio: Pages se publica desde el commit `12053`.
- Worker: cargar `worker-UADAVSTREAM-V11.7-11752.js` en Cloudflare. No requiere migración de base ni variables nuevas.

## Pruebas
- `node core/tests/admin-import-export.mjs`
- `node core/tests/admin-navigation.mjs`
- `node core/tests/admin-modules.mjs`
- `node core/tests/admin-pending.mjs`
- `node core/tests/federated-source-lifecycle.mjs`
- `node core/tests/worker-monetization-guard.mjs`
- `node core/tests/worker-audit-log.mjs`
- La página Buscar ahora carga el módulo que recuerda los artistas consultados. La prueba reprodujo el fallo real y quedó actualizada para cargar esa dependencia.
- Se actualizaron dos pruebas que aún suponían que eliminar una cuenta era método inválido y no contemplaban el registro de cuentas eliminadas; ambas verifican ahora la conducta actual.
