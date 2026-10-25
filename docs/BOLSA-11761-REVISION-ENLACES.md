# Bolsa 11761 · revisión simple de enlaces · solo staging

Frontend para la rama `audit/continuidad-demo-20261019`; Worker separado en `release/radio-studio-staging-rc-20261020`. No se modifica producción.

## Cambios

En Fuentes automáticas, «Agregar una ficha puntual» y «Revisar y publicar» de un candidato usan ahora el mismo editor. La revisión muestra la publicación original y permite corregir título, descripción y fecha. Se eliminó el JSON técnico del recorrido y el segundo circuito de confirmación duplicado. La revisión no escribe ofertas.

Antes de consultar HTML se comprueba health sin enviar la clave Admin y se exige Worker 11761 o posterior con D1 disponible. Con el Worker 11760 actual, la captura se bloquea y explica que hace falta actualizarlo; CSV permanece disponible. Los requests siguen usando exclusivamente la API staging.

Confirmar envía una sola ficha revisada. No informa éxito con respuestas vacías o de otra sección. Un error conserva el texto y exige una nueva revisión del enlace, manteniendo el borrador si corresponde al mismo origen. No reenvía una escritura automáticamente. Una respuesta vieja no reemplaza otro editor. La revisión de fuentes evita llamadas superpuestas, respeta cambios de sección e informa los lotes pendientes del nuevo Worker.

El helper reutilizable `uadav-jobs-import.js` conserva el importador CSV probado y añade normalización/confirmación de fichas y validación de respuestas. Descarta campos privados o identificadores ajenos del preview. Las fechas usan el día de Argentina. La visibilidad de ofertas existentes continúa respetándose.

## Pruebas y fuente sintética

Doce casos nuevos cubren normalización, fecha/calendario, aislamiento, resultados inciertos, análisis superpuestos, respuestas tardías, guardado único, borradores, bloqueo con Worker viejo y revisión por lotes. Total focalizado aprobado localmente: **132 pruebas**, más el control de importación/exportación.

`tests/staging-job-source.html` es el tercer y único diagnóstico nuevo permitido explícitamente por el build. No se publica el resto de `tests`, los datos privados ni el Worker. Contiene JSON-LD ficticio en castellano para comprobar la lectura real después del despliegue manual. No es una oferta real y no recibe postulaciones.

La QA remota del nuevo capturador requiere desplegar el Worker 11761. Las pruebas locales y el frontend publicado no prueban que sus controles estén ya aplicados en Cloudflare. La guía del Worker detalla los límites: la validación DNS no fija la conexión HTTP y el egreso productivo sigue requiriendo verificación específica.

Correo, restauración, cron y producción no se habilitan con este cambio.
