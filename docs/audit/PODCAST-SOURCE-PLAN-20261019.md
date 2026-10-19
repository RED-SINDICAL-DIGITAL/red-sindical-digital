# Fuentes de podcasts: carga manual y automática

**Actualización de esta sesión:** RSS/Atom, Admin, sincronización D1 y cron opt-in implementados y probados de forma aislada. Falta desplegar el Worker en staging y aceptar fuentes reales. Ver [entrega y estado actual](PODCAST-RSS-STAGING-DELIVERY-20261019.md). La sección de pipeline inferior conserva el plan original; los adaptadores automáticos de YouTube/Spotify siguen pendientes.
Fecha: 2026-10-19. Rama audit/public-job-status-20261012. Sin despliegue del Worker ni cambios en producción.

## Decisión de producto
Una biblioteca de programas y episodios de audio/video alimentada manualmente o desde fuentes registradas en Admin. Mantener enlaces a los medios originales, sin alojarlos ni extraer audio de plataformas. No prometer compatibilidad universal: cada adaptador informa capacidades reales y conserva un enlace oficial cuando no admite reproducción integrada.

## Matriz de fuentes
| Fuente | Manual | Automática prevista | Reproducción |
| --- | --- | --- | --- |
| RSS público de cualquier alojamiento compatible | Registrar feed del programa; importar archivo/lista de episodios | Leer feed, enclosure, GUID, fecha, duración y portada; detectar novedades | URL original de audio/video compatible |
| YouTube | Enlace de episodio o playlist | API oficial de playlists y catálogo del canal, con paginación | Player oficial visible |
| Spotify | Enlace de programa/episodio | Metadatos/listado mediante API oficial y credenciales, sujeto a disponibilidad | Embed oficial; nunca extracción de audio |
| Apple Podcasts | Enlace oficial y RSS del programa cuando esté disponible | Descubrimiento de catálogo/RSS mediante vía oficial | RSS original o enlace al servicio |
| SoundCloud, Vimeo y otros proveedores | Enlace oficial | Adaptador sólo si existe API/feed autorizado | Embed oficial compatible o enlace de salida |
| MP3, M4A, AAC, OGG, WAV, MP4, WebM propios/autorizados | URL del episodio, portada y ficha | RSS o listado JSON/CSV de URLs | Player nativo según codecs del navegador |
| Drive u otros enlaces de archivos | Enlace público autorizado | Sólo mediante feed/listado autorizado; no rastreo de carpetas privadas | Depende del enlace y proveedor; alternativa al original |

Servicios privados, premium o sin feed/API pública no se importan automáticamente por tener un enlace. No se declaran descargables, disponibles offline ni reproducibles en segundo plano.

## Admin propuesto para las fuentes
Nombre del programa; URL; tipo RSS/YouTube/servicio; audio/video/mixto; idioma; artista; portada; activar/pausar; intervalo; última revisión; nuevos/actualizados/duplicados/errores; probar; sincronizar ahora.
Primera lectura en vista previa con revisión editorial. Publicación automática sólo como elección explícita de esa fuente. Mostrar errores sin borrar los episodios publicados.

## Pipeline pendiente de implementación
1. Registro privado de fuentes con validación HTTPS y controles de redirección, tamaño, tiempos y destinos.
2. Parser RSS con namespaces, CDATA y enclosures de audio/video; no confundir feed con medio reproducible.
3. Identidad estable por fuente+GUID; respaldo URL del enclosure; conservar URLs sensibles a mayúsculas, no unificar por título.
4. Upsert idempotente en catálogo; preservar edición editorial, visibilidad y portadas manuales; nunca borrar episodios por fallo o ausencia temporal del feed.
5. Adaptador YouTube con paginación y cursores; credenciales sólo en Worker.
6. Sincronización manual comprobable antes de cron; intervalos, caché condicional ETag/Last-Modified, límites y reintentos.
7. Pruebas aisladas de duplicados, feeds malformados, fallos, redirects y mezcla audio/video; aceptación en staging con fuentes autorizadas.

## Estado verificado
- Catálogo público de podcasts, filtros audio/video, enlace al player y recientes: implementados en frontend.
- Carga manual de contenido e importación masiva de podcasts: rutas existentes en Admin/Worker.
- El módulo federated_sources actual sólo admite event/job. No se habilitó podcast cambiando una etiqueta.
- Ingesta RSS, registro específico de fuentes podcast y cron de podcasts: pendientes. No activados por este documento.
- El Worker se entregará para despliegue manual en staging cuando la implementación y pruebas estén completas.

## Referencias oficiales consultadas
https://podcasters.apple.com/support/823-podcast-requirements
https://podcasters.apple.com/support/3684-video-podcasts
https://developers.google.com/youtube/v3/docs/playlistItems/list
https://developer.spotify.com/documentation/embeds
https://developer.spotify.com/documentation/web-api/reference/get-a-show
