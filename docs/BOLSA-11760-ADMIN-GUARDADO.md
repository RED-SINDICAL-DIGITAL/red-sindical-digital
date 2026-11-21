# Bolsa 11760 · guardado de Admin · solo staging

## Hallazgo y corrección

En la QA remota del 24/10/2026 se publicó una oferta ficticia guardada en una cuenta, se recibió una candidatura y se entregó un aviso próximo a vencer. La revisión posterior devolvió cero pendientes y Mi Perfil mostró el aviso sin contactos ni claves. La lectura quedó confirmada como «Sin avisos nuevos».

Oferta: `JOB-MVN0OQA5-28B033C1422D`. Candidatura: `POST-MVN0P9GO-56F2C26E`. La cuenta nueva solo mostró esta oferta; la candidatura se envió sin guardarla en la cuenta. No se inspeccionaron códigos de recuperación ni claves privadas.

Al intentar cambiar desde Admin la fecha límite al día anterior, el Worker rechazó correctamente la escritura con «Fecha de caducidad inválida o vencida». El formulario no capturaba ese rechazo y no mostraba el motivo. Por eso la fecha persistida siguió siendo 2026-10-24. Este intento no valida el aviso de oferta vencida ni la ejecución de un cron.

La corrección de Pages agrega estado persistente dentro del editor, conserva el borrador si falla, restaura los controles y rechaza respuestas incompletas o de otra oferta. Impide guardados simultáneos y no reenvía escrituras automáticamente. Una respuesta tardía no cierra otro editor ni cambia de sección. La creación desde Admin también envía el identificador de solicitud requerido por D1, conservado durante un reintento explícito del mismo borrador.

No se cambia la validación de fechas del Worker ni se habilitan correo, restauración, cron o producción. Las ramas siguen separadas.

## Validación

Ocho casos nuevos de regresión cubren el rechazo real, conservación del formulario y caché, doble clic, respuesta incierta o incorrecta, editor/sección reemplazados y solicitud identificada para una nueva oferta. El workflow de Bolsa incluye este archivo. Total ejecutado del grupo focalizado: **100 pruebas aprobadas** localmente y en CI `40142314409`.

El manifest público confirmó `1ab6a4f8b6acc15199a72f09f1007ef4bbb50eb0`, con el nuevo `admin.html`. En la repetición remota, el editor mostró «Fecha de caducidad inválida o vencida», conservó la fecha del borrador y volvió a habilitar Guardar. Corregida a una fecha válida, el guardado cerró el modal y actualizó la lista. La creación identificada desde Admin tiene prueba local/CI; en este ensayo solo se creó desde el formulario público, para evitar sumar otro registro innecesario.

La oferta se renovó hasta 2026-11-23 y luego se cerró. Mi Perfil conservó la candidatura «Recibida» y el catálogo público volvió a las cinco ofertas originales. La revisión final dio cero avisos pendientes. El respaldo D1 posterior contiene 9 ofertas, 10 postulaciones, 3 vínculos y una marca de aviso, validada junto con su anuncio y lectura. El respaldo privado no está en git. No se requiere otro despliegue del Worker 11760.

El aviso de una oferta ya vencida y el cron real siguen sin verificar remotamente. La recuperación por correo permanece deshabilitada y producción permanece sin cambios.
