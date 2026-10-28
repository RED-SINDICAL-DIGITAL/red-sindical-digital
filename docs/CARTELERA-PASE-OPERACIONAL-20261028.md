# Cartelera · pase operacional de staging

426 pruebas del Worker aprobadas. Nueva revisión 11770-cartelera-cierre-20261028. Corrección UUID ya incorporada y validada en el lote anterior; se suma auditoría de transición de solo lectura, descarga de respaldo con checksum y revisión identificable en salud/capacidades.

La auditoría bloquea aprobación ante registros KV ausentes en D1, versiones diferentes, copias KV conflictivas, JSON malformado, nuevas publicaciones D1 que no eran visibles en KV y cambios KV durante la consulta. Devuelve cantidades y hash, sin datos de contacto. No es un snapshot distribuido; requiere una ventana sin ediciones al activar. No migra datos ni cambia flags. Requiere Admin, hostname de staging y mismo origen; rechaza POST y producción. Página con CSP y clave únicamente en memoria; respaldo privado descargado al equipo del operador.

Pruebas nuevas: comparación idéntica y ausencia de PII/cambios D1; bloqueos por faltantes, ocultos y publicaciones adicionales; datos/copies inválidas; aislamiento de host, origen, método y autorización. Suite completa 426/426. La interfaz nueva no tiene validación visual remota todavía.

Pendiente humano: desplegar candidato, consultar /qa/cartelera-staging, guardar respaldo y compartir resultado seguro. No afirmar cierre operacional ni activar automáticamente antes de esa comparación. Avisos generales continúan fuera de alcance: qa-only es la única modalidad de esta revisión. Producción sin cambios.
