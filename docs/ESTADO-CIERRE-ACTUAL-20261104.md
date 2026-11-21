# Estado consolidado y últimos controles de cola · 4/11/2026

## Evidencia de cierre vigente
- Recuperación real por correo: operador aportó result complete con http_qa_flow true, enlace canjeado, clave anterior revocada, nuevo acceso privado y oferta QA conservada sin publicación.
- Vencimiento remoto de destacado: observación de D1 en el turno del 4/11 15:07Z, estado vencido y flag false; sin mantenimiento manual. QA retirada de próximos eventos cambiando su fecha, sin borrarla.
- Sincronización: seis verificaciones contra la API real con dos clientes independientes, incluidos favoritos, playlists, conflictos y revocación.
- PC y celular físicos: operador confirmó PASO TODO OK tras las instrucciones de favoritos en ambas direcciones, playlist, cambio de sección y avance de video. Es confirmación del operador, no observación remota independiente. No seguir registrando esa prueba general como pendiente.

## Correcciones finales de cola
- Reproducir un video dentro de una playlist personal inicia su cola desde esa posición, conservando los siguientes videos compatibles. Las fuentes no YouTube conservan reproducción individual.
- Los botones multimedia nativos Anterior/Siguiente llaman al controlador de la cola activa. Se limpian al cerrar o cambiar a otro medio, incluida radio; no quedan controles del reproductor anterior.
- Se mantiene el límite de 250 entradas y se limpian metadatos transitorios al construir la instantánea. No se modifican las listas guardadas ni los controles oficiales de YouTube.

Validación de este cambio: 779/779 pruebas Pages. La confirmación física anterior no certifica específicamente los dos controles nativos añadidos ahora.

## Pendientes reales para una versión pública integral
1. Recuperación de ofertas reales: el circuito probado sigue limitado a QA y recovery_enabled false. Falta ampliar y probar la solicitud, identidad/contacto autorizado, protección de abuso y canje para ofertas reales antes de activar el servicio público. No es suficiente cambiar una variable.
2. Correo operativo general de Cartelera continúa en modalidad qa-only; la prueba de recepción no habilita envíos generales.
3. Revisar y cargar agenda real vigente para la presentación: la agenda de staging conserva un evento DEMO histórico. No confundir contenidos editoriales de archivo con fechas actuales.
4. El despliegue productivo requiere un plan específico de configuración, respaldo y reversión. Producción no fue autorizada ni modificada en esta pasada.

No se afirma que toda la plataforma esté terminada. Los informes anteriores son históricos; este estado incorpora las confirmaciones del operador y distingue pruebas aisladas, HTTP reales y prueba física.
