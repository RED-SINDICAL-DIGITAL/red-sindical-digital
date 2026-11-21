# Radio: enlace antiguo y metadatos — 18/10/2026

Se agregó radios.html como acceso compatible que conserva query y fragmento al dirigir a radio.html, incluida la emisora seleccionada. Se corrigió en app.html la etiqueta de metadatos para no anteponer el artista cuando el título ya comienza con ese artista y un separador reconocido. No se alteró la reproducción.

12 pruebas locales satisfactorias: recuperación de radio, pausa/error/fin, etiqueta, alias y navegación privada del shell. Cambios en rama audit/public-job-status-20261012, sin merge o producción.

Verificación del navegador posterior al commit: staging todavía sirvió el acceso anterior y terminó en Inicio. No se declara verificado el alias desplegado ni la etiqueta nueva. Requiere comprobar propagación del frontend antes de cerrar. La reproducción real anterior permanece documentada por separado.

La construcción completa local no pudo certificarse: este espejo parcial carece de index.html; no es un checkout completo. La primera invocación además omitió UADAV_STAGING_ORIGIN, corregida antes de identificar el archivo faltante. Esta limitación no se presentó como un error de la aplicación publicada. CI de rama se consulta por separado.
