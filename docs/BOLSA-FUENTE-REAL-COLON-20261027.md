# Bolsa · última comprobación de fuente externa real · staging

El ensayo privado11769 ya fue informado aprobado:14/14fases, rollback, comparación,14ofertas/11postulaciones/21cuentas y1identidad de correo. No repetir despliegues, mensajes de cuenta, respaldo o restauración. Evidencia `evidence/bolsa-11769-restauracion-real-aprobada-20261027.json`.

Se preparó una fila de convocatoria laboral vigente y verificable, sin inventar un empleo. Fuente primaria: [detalle oficial del Teatro Colón](https://teatrocolon.org.ar/concurso/concurso-publico-y-abierto-orquesta-estable-del-teatro-colon-4/) e [índice oficial](https://teatrocolon.org.ar/concursos/), revisados27/10/2026. Es la vacante de Viola Fila de la Orquesta Estable, cierre23/11/2026. No se afirma importe salarial, resultado de selección o aceptación de postulantes.

Archivo: `releases/bolsa-fuente-real-colon-20261027.csv`. UTF-8 con BOM, una fila y campos compatibles con el importador actual. Enlace de postulación igual al origen oficial; la documentación se presenta allí. El dominio no está en la lista de captura HTML directa: CSV es la vía admitida y no requiere ampliar permisos de red o desplegar otro Worker. El código de importación ya existe.

## Prueba en el Admin existente

Usar solo `https://uadav-stream-staging.pages.dev/admin`, API `uadav-api-staging`. No crear ni comunicar claves. La captura de Work observó un formulario de acceso administrativo; no una sesión autenticada. Se ofreció el formulario seguro; el intento fue cancelado y la inspección posterior sigue mostrando el acceso. No se inició la importación ni se repite el pedido de ingreso. El archivo y el recorrido quedan disponibles para una sesión autorizada posterior.

1. En **Importar / exportar → Incorporar una planilla**, elegir tipo **Bolsa de trabajo**, archivo CSV y **Publicar si los datos son válidos**. Revisar la única fila y confirmar su incorporación.
2. En Bolsa pública, comprobar el título y **Ver convocatoria**. Debe abrir el origen oficial y no un formulario interno de candidatura. No enviar una postulación o documentación al Teatro Colón durante esta prueba.
3. Repetir el mismo archivo: debe actualizar la ficha, sin duplicarla. Desde Admin → Bolsa de trabajo, identificar esa URL/título y usar **Ocultar**. Confirmar su ausencia del catálogo. Conservar el registro; no eliminarlo.
4. Reimportar una vez ya oculta: debe seguir oculta y conservar su único registro. Si ya existía oculta antes de la prueba, la importación conserva ese estado; usar **Reactivar** desde la ficha para comprobar la visibilidad y luego **Ocultar**.

El agente puede hacer este recorrido si tiene sesión de Admin en Work; no se le pide al usuario repetirlo además. El resultado remoto se documentará con fuente, conteos/identificador y estado, sin contactos o credenciales. La prueba local de abajo está aprobada; no sustituye la publicación/ocultación observadas en staging. La convocatoria puede quedar oculta al terminar el ensayo y el operador decidirá su publicación posterior.

Si se usa el archivo después del cierre, el importador debe rechazar publicarlo. No extender la fecha para aprobar una prueba ni asumir que una página todavía disponible sigue aceptando inscripciones.

## Verificación local ya completada

Desde Worker, con un checkout separado de Pages: `node scripts/rehearse-job-source-csv.mjs /ruta/al/checkout-pages`. El segundo argumento es opcional cuando existe el hermano `uadav-pages`.

Lee el CSV con el SheetJS real de Pages y pasa por normalización, sendBatch, rutas Worker y D1/SQLite en memoria. Ocho controles: autorización Admin, rechazo de captura directa antes de red, importación CSV/vínculo externo, URL idempotente, rechazo de candidatura interna, ocultación/reimportación sin reapertura, error de URL sin pérdida y vencimiento conservando historial. Fecha del ensayo local fija al día de revisión; fecha límite original intacta. Cero solicitudes de red, publicaciones remotas, correos o datos de postulantes.

Evidencias `evidence/bolsa-fuente-real-colon-preparada-20261027.json` y `evidence/bolsa-fuente-real-csv-ensayo-local-20261027.json`. No se copió código de Pages a Worker ni se mezclaron ramas. Producción intacta; restore operativo continúa sin habilitación.
