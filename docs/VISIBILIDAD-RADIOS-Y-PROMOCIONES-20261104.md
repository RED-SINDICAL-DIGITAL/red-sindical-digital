# Visibilidad de radios y entidades comerciales — 2026-11-04
Solo staging. La fila de radios de respaldo de Explorar excluye estados ocultos/privados/suspendidos/eliminados y booleanos de desactivación. Antes podía reaparecer una radio oculta si la sección automática de entidades no reemplazaba esa fila.
Hero/Cartelera comerciales también excluyen active/activa/activo/enabled/public/is_public=false, además de las reglas existentes de privacidad.
862 pruebas aprobadas. Dos regresiones: fila por defecto sin sección automática y resolución comercial de entidades desactivadas.
Pendientes comerciales sin resolver por esta corrección: campañas de banner requieren creatividades y asociación explícita a uno de los tres espacios; radios/auspicios requieren integración de entrega y prueba específica. No se activan solo por estar en el catálogo.
Sin cambios de Worker, precios, pagos o producción.
