# Consultas del Admin — 17/10/2026

## Inspección real

En staging se abrió Contratación gratuita → Contrataciones y Marketplace. Se observaron dos consultas sintéticas, una Leída y una Nueva. Se abrió la primera y se verificó el detalle, sin modificar estados, enviar mensajes, contratar ni pagar. El destinatario aparecía sólo por su identificador ART.

## Mejora

La vista carga el catálogo de artistas con tolerancia a fallo para resolver nombres; si no está disponible, conserva el identificador y las consultas. Listado y detalle muestran el nombre sin perder las referencias. La búsqueda incorpora el nombre y se combina con un filtro de estados. Consultas sin estado conservan el tratamiento Nueva. Se mantiene la paginación existente de 100 elementos por incremento y los índices reales de acción después de filtrar. No se modifican Worker, permisos, entrega al artista ni estados.

## Pruebas

Seis pruebas ejecutan el renderizador real: búsqueda por nombre, catálogo ausente, combinación de filtros e índice correcto, estado legado y vacío explícito, escape HTML y acceso a 205 consultas por Cargar más. En conjunto con guardado, cancelación y pendientes: 21 pruebas locales satisfactorias.

Pendiente: verificación visual de esta versión en Pages y resultado de CI. La inspección real inicial corresponde a la pantalla previa a estos cambios. La búsqueda opera sobre las consultas entregadas por la API; no demuestra paginación remota ilimitada ni modifica los límites del backend.
