# Bolsa 11760 · importación por planilla · solo staging

## Hallazgo

La carga genérica de Bolsa no enviaba la elección de visibilidad, omitía los metadatos externos y podía duplicar filas sin ID al repetir un archivo. El backend genérico decide `activo` por defecto y su índice se basa en IDs generados para registros anteriores; un título repetido no equivale a una identidad estable. No se utilizó esa ruta para crear datos de prueba.

## Cambio de Pages

El módulo reutilizable `uadav-jobs-import.js` normaliza las filas de Bolsa y usa exclusivamente `admin/federated/import`, ya disponible en el Worker 11760. No se requiere nueva migración o despliegue Worker.

- Cada fila exige título, descripción y una URL de origen HTTPS. La URL canónica es la identidad de la ficha; no se aceptan IDs de planilla para sobrescribir publicaciones nativas. Anclas distintas no crean fichas distintas. La identidad sigue la comparación de URLs sin mayúsculas del backend existente.
- El origen y el enlace de postulación se conservan como externos. No se importan credenciales, correos ni datos privados de contratantes. La postulación se dirige a la publicación de origen.
- Las ofertas nuevas respetan «Dejar ocultos». Para publicar una nueva oferta se exige fecha calendario vigente. Las existentes conservan su visibilidad actual; se gestiona desde Bolsa para no reabrir una oferta que se ocultó después.
- Hasta cinco ofertas por transacción de D1, con lotes secuenciales. Una respuesta incompleta o incierta detiene los siguientes lotes y exige revisar el archivo otra vez; no reenvía escrituras automáticamente. Repetir una URL actualiza esa ficha.
- La revisión valida todo el archivo antes de habilitar confirmación. Rechaza URLs repetidas incluso en distintas hojas. Cambiar archivo/opciones, abrir otra sección o revisar un archivo nuevo descarta respuestas antiguas y detiene los siguientes lotes.
- El formulario mantiene errores visibles. Se corrigió también una referencia `source` inexistente que impedía abrir el editor de candidatos de una fuente; utiliza la fuente `src` que realmente recibió.

Los otros tipos de importación conservan sus rutas. Comparten la protección de confirmación, errores, doble clic y salida de la pantalla. El capturador de fichas desde una URL requiere su propia verificación remota; la QA de CSV no prueba descubrimiento automático o extracción HTML.

## Pruebas

20 casos nuevos: origen/visibilidad, fecha de Argentina, calendario, campos requeridos, URLs, identidad, duplicados, lotes, aislamiento de staging, respuestas inciertas, doble clic, salida de pantalla, carreras entre lecturas y editor de candidatos. Total focalizado de Bolsa: 120 pruebas, más el control de importación/exportación y CSV con protección de fórmulas.

Los archivos `tests/fixtures/bolsa-import-11760-oculta.csv` y `bolsa-import-11760-publicada.csv` contienen solo datos ficticios. Los tests no se publican en Pages. La QA remota debe verificar carga oculta, repetición sin nuevas ofertas, origen/enlace externos en la publicada y ocultamiento final desde Admin. Se debe generar un nuevo respaldo después del ensayo.

Correo, restauración y producción permanecen sin cambios. La validación de fechas de algunos endpoints del Worker anterior usa UTC; armonizarla con el día de Argentina sigue siendo un pendiente separado de esta corrección de interfaz.

## Corrección posterior a la primera lectura CSV

La primera revisión remota no escribió datos: rechazó una fecha que el lector antiguo había convertido en un número y mostró acentos mal decodificados. Se corrigió la lectura de CSV/TSV mediante texto UTF-8 y `raw:true`; un archivo con caracteres inválidos pide guardarlo como UTF-8. Las fechas reales de Excel se convierten desde sus celdas numéricas respetando la época 1900/1904. Se probaron el CSV exacto, punto y coma, comillas, BOM, ceros iniciales y archivos XLSX reales con ambas épocas.

Admin reemplaza SheetJS 0.18.5 del CDN npm por la distribución oficial **0.20.3**, incluida localmente con su licencia Apache 2.0. Fuente: <https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js>. SHA-256 de los bytes originales: `cc015130aa8521e7f088f88898eba949ccdcbfb38df0bd129b44b7273c3a6f41` (951.904 bytes). No se cambia la CSP para habilitar otro servidor de scripts.

Referencias del proveedor: [instalación y distribución oficial](https://docs.sheetjs.com/docs/getting-started/installation/standalone/), [lectura sin conversiones implícitas](https://docs.sheetjs.com/docs/api/parse-options/) y [aviso de seguridad y versión corregida](https://cdn.sheetjs.com/advisories/CVE-2024-22363). El cambio de dependencia evita seguir utilizando una versión afectada; no equivale a una auditoría completa de todos los formatos de planilla.
