# Fallos de imágenes remotas — 2026-11-04
Staging. Las tarjetas de entidades conservan candidatos HTTPS únicos. Si una imagen válida falla al descargar, prueban la siguiente una sola vez; agotada la lista se muestra la inicial existente. No hay ciclos ni sustitución de destino, visibilidad o contenido.
850/850 pruebas aprobadas. Regresión ejecuta eventos de error y comprueba prioridad, deduplicación, descarte de esquema inseguro y fallback final.
Despliegue anterior 0794568: Cloudflare Pages y ui-and-isolation aprobados. Sin Worker ni producción modificados.
