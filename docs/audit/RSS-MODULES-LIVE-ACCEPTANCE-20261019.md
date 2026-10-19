# Aceptación real RSS y módulos — 2026-10-19

Entorno: uadav-stream-staging.pages.dev y uadav-api-staging.uadavstream.workers.dev. Usuario confirmó despliegue manual del Worker. No se usó producción ni pagos.

## Verificado desde navegador y API pública
- Admin autenticado reconoce Fuentes RSS. D1 y KV operativos.
- Muestras originales propias, generadas con ffmpeg (tonos, fondo plano y texto), publicadas sólo en rama audit/public-job-status-20261012 bajo assets/qa-podcasts-20261019. No son episodios editoriales ni contenido de terceros.
- Fuente guardada: DEMO QA · Podcasts propios · 19-10-2026. Feed público: https://uadav-stream-staging.pages.dev/assets/qa-podcasts-20261019/feed.xml
- Vista previa: 2 episodios compatibles, 0 omitidos. El catálogo público permaneció vacío antes de importar.
- Primera importación: 2 nuevos, 0 actualizados, 0 sin cambios. Segunda importación: El RSS no cambió. No duplicados.
- MP3: duración 12 s, readyState 4, error null, avance real a 5.163327 s. Pausa confirmada mediante propiedad nativa y controles de salto disponibles.
- MP4: duración 10 s, imagen 640x360, readyState 4, error null y avance real a 4.678077 s.
- Recientes de Mi perfil mostró ambos episodios. Reabrir el video desde recientes y navegar a Trabajo conservó el mismo reproductor: currentTime 1.216194 → 6.917398 s, pausado false.
- Ocultar el audio en Admin dejó sólo el video en el catálogo público; volver a mostrarlo restauró ambos.
- Admin Sistema > Módulos ofrece los nuevos selectores. Podcasts: activo → desactivado → activo mediante Guardar módulos. Durante el apagado, ruta directa mostró Sección desactivada y API pública respondió HTTP 404 / MODULE_DISABLED / podcasts. Al restaurar, ambos episodios seguían visibles.
- Estado final: Podcasts activo; los dos episodios de QA visibles; fuente en importación manual; actualización programada desactivada; sin reproducción dejada en marcha.

## Mejoras surgidas de la aceptación
- Recientes de Mi perfil incorpora nombre accesible y rol de botón; mantiene teclado Enter/Espacio y añade foco visible.
- Admin diferencia carga manual de RSS. Nuevo episodio manual conserva content_type podcast, también al detectar la plataforma. Antes podía quedar como enlace/audio genérico y desaparecer del filtro público de podcasts.
- 19 pruebas de identidad y perfil más 2 de clasificación manual aprobadas; scripts inline comprobados.

## No acreditado por esta prueba
Cron automático real (no se activó), feeds de terceros, importación automática YouTube/Spotify, pantallas bloqueadas, dispositivos físicos móviles/tablets/TV, mandos remotos y AirPlay/Cast. La reproducción de estas muestras nativas no resuelve la incidencia previa de YouTube en el navegador de nube.


## Biblioteca y playlists — ampliación del 19 de octubre

- Selector accesible de playlists en el reproductor: nombres visibles, creación directa, validación de nombre vacío y aviso sin duplicar contenido.
- Comprobado en staging con el audio propio QA: crear lista, guardar, guardar por segunda vez, abrir lista y volver a reproducir; Favoritos y Ver más tarde muestran el audio guardado.
- La playlist abierta se conserva ante actualizaciones de historial y sincronización. Prueba local cubre cambio de orden y desaparición de la lista.
- Búsqueda dentro de la playlist sin salir de ella, insensible a tildes. Prueba local verifica que quitar un resultado filtrado conserva los contenidos ocultos por la búsqueda. Verificación visual en staging: buscar «audio» conserva la lista y devuelve el episodio.
- Los botones Biblioteca/Favoritos/Más tarde y Playlists del reproductor usan sus módulos de marca blanca. Guardar revisa nuevamente el módulo playlists. Sin alterar configuraciones reales para esta comprobación.
- Controles de 44 px como mínimo, estado aria-pressed para favoritos y guardado posterior. Validación en navegador de escritorio; celular físico y Smart TV pendientes.
- La lista «DEMO QA · Mi primera playlist» y los dos guardados son datos de prueba del navegador. No se eliminó contenido del usuario. Reproducción cerrada al terminar.
