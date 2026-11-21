# Podcasts de audio y video — 2026-10-19

Rama audit/public-job-status-20261012, staging; sin producción ni pagos.

## Implementación
Catálogo de episodios con búsqueda sin acentos, filtros Todos/Audio/Video, carátulas alternativas, títulos seguros como texto y acciones Escuchar/Ver/Abrir según la información de la fuente. Si un servicio externo no declara su formato se muestra como Servicio externo en Todos, sin inventar que sea audio o video.
Normaliza URL de url/href/media_url/audio_url/video_url/enclosure_url/source_url/link. Acepta listas del API en array o items/data/results. Distingue carga fallida con reintento de catálogo vacío.
Dentro del shell, delega al reproductor persistente existente, que registra los recientes de Mi perfil. Fuera del shell, audio/video directos usan un diálogo con controles nativos; otros enlaces llevan al servicio oficial.
Sólo enlaces HTTP(S), sin alojar archivos ni descargar contenido. No incorpora lector RSS, importación automática, progreso guardado, descarga offline ni promesa de segundo plano. Un enlace a un feed RSS no equivale a un episodio reproducible.

## Validación
12 pruebas locales aprobadas: normalización, formatos, filtros, URLs, controles nativos y enlaces oficiales. Aceptación real por fuente, incluida duración, bloqueo móvil y reproducción de video, requiere episodios autorizados en staging; el resultado visual se informa en la sesión.
