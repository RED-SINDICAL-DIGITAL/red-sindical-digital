# Bolsa 11760 · guardado de Admin · solo staging

## Hallazgo y corrección

En la QA remota del 24/10/2026 se publicó una oferta ficticia guardada en una cuenta, se recibió una candidatura y se entregó un aviso próximo a vencer. La revisión posterior devolvió cero pendientes y Mi Perfil mostró el aviso sin contactos ni claves. La lectura quedó confirmada como «Sin avisos nuevos».

Oferta: `JOB-MVN0OQA5-28B033C1422D`. Candidatura: `POST-MVN0P9GO-56F2C26E`. La cuenta nueva solo mostró esta oferta; la candidatura se envió sin guardarla en la cuenta. No se inspeccionaron códigos de recuperación ni claves privadas.

Al intentar cambiar desde Admin la fecha límite al día anterior, el Worker rechazó correctamente la escritura con «Fecha de caducidad inválida o vencida». El formulario no capturaba ese rechazo y no mostraba el motivo. Por eso la fecha persistida siguió siendo 2026-10-24. Este intento no valida el aviso de oferta vencida ni la ejecución de un cron.

La corrección de Pages agrega estado persistente dentro del editor, conserva el borrador si falla, restaura los controles y rechaza respuestas incompletas o de otra oferta. Impide guardados simultáneos y no reenvía escrituras automáticamente. Una respuesta tardía no cierra otro editor ni cambia de sección. La creación desde Admin también envía el identificador de solicitud requerido por D1, conservado durante un reintento explícito del mismo borrador.

No se cambia la validación de fechas del Worker ni se habilitan correo, restauración, cron o producción. Las ramas siguen separadas.

## Validación

Ocho casos nuevos de regresión cubren el rechazo real, conservación del formulario y caché, doble clic, respuesta incierta o incorrecta, editor/sección reemplazados y solicitud identificada para una nueva oferta. El workflow de Bolsa incluye este archivo. Total previsto del grupo focalizado: 100 pruebas.

Pendiente antes de dar por verificada la corrección remota: publicación automática de Pages, manifest de origen, repetición del rechazo con el nuevo estado visible y guardado válido. La oferta ficticia debe terminar cerrada, con candidatura conservada y un respaldo actual verificado. No se requiere un nuevo despliegue del Worker 11760.
