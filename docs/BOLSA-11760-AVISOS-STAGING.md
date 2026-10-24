# Bolsa 11760 · avisos de vencimiento · solo staging

## Estado de la entrega

Código preparado en `release/radio-studio-staging-rc-20261020`. El frontend está en `audit/continuidad-demo-20261019`. No fusionar ramas ni aplicar estos cambios en producción. Hasta que se complete el paso manual, el Worker publicado sigue siendo **11759** y estos avisos no están validados en Cloudflare.

El usuario completó desde su celular el recorrido de publicar, postularse, abrir el archivo del contratante, consultar candidatos, cerrar la oferta y consultar después la candidatura con su propio comprobante. El servidor y Admin corroboraron el cierre y la conservación de la postulación; la consulta final del archivo en el teléfono es una confirmación del usuario. El backup privado posterior contiene 8 ofertas, 9 postulaciones y 2 asociaciones. El detalle está en `BOLSA-11759-MI-PERFIL-STAGING.md`.

## Comportamiento preparado

- Aviso privado en Mi Perfil para ofertas que vencen dentro de los próximos **3 días calendario**, incluido hoy, y para ofertas cuyo día límite ya pasó. Se usa el día de Argentina. No se cambia la vigencia comercial de 30 días ni el cierre/renovación existentes.
- Solo se avisa a la cuenta que guardó explícitamente la oferta. No se vincula ni busca una cuenta por su correo. Publicar sin cuenta y usar los comprobantes sigue disponible.
- Se excluyen cierres manuales, ofertas ocultas, pendientes de revisión, fechas inválidas y fuentes externas desactualizadas. Las postulaciones se conservan.
- `job_expiry_notices` registra qué cuenta recibió cada tipo de aviso por oferta y fecha límite. Borrar un aviso visible no lo vuelve a generar. Renovar a otra fecha permite un nuevo aviso para esa nueva vigencia. El historial no contiene correos, mensajes de candidatos ni claves; se elimina al borrar la cuenta.
- Hasta cinco avisos por lote. La revisión no escribe nada y devuelve una huella; la confirmación exige esa misma revisión. Dentro de la transacción se vuelven a comprobar oferta, revisión y asociación. Cierre, renovación, cambio de cuenta o eliminación concurrentes cancelan el lote completo.
- Registro de deduplicación y aviso visible se guardan juntos. Dos ejecuciones simultáneas no generan dos avisos. Un error de SQL deja ambos sin aplicar.
- El mantenimiento existente procesa primero vencimientos y luego avisos. **No se agrega ni activa un cron**. Si no hay ejecución programada configurada, se puede ejecutar manualmente desde Admin. La ejecución programada real sigue pendiente de verificar.
- En Admin → Auditoría: **Revisar vencimientos**, lista de hasta cinco ofertas, confirmación explícita y **Enviar avisos revisados**. Un resultado incierto exige una revisión nueva; el cliente no reenvía automáticamente una escritura.

## Respaldo y recuperación

El export incluye el historial y `job_expiry_notices_available`. Pages comprueba su esquema, unicidad, cuentas y relación con los avisos visibles; rechaza un snapshot donde aparezca un aviso de vencimiento sin su registro. Se permite conservar un registro cuyo aviso visible u oferta haya sido eliminado, para evitar reenvíos al recuperar datos.

La recuperación de faltantes conserva también el historial de las ofertas nuevas que repone, dentro de la misma transacción. Valida IDs, fechas y huellas; omite cuentas eliminadas, preserva registros existentes y no vuelve a emitir los avisos históricos. Hasta 100 marcas por lote de recuperación; si se supera, reducir la cantidad de ofertas recuperadas. **La restauración remota permanece bloqueada**: no agregar `ENABLE_JOB_D1_RESTORE` hasta probar en una base desechable.

## Paso manual en Cloudflare

1. Abrir **D1 → uadav-staging-db → Console**. Verificar que es el binding `DB` de **uadav-api-staging**. La tabla de cuentas de 11759 ya debe existir. Ejecutar todo [20261024_job_expiry_notices.sql](../migrations/staging/20261024_job_expiry_notices.sql): crea una tabla y un índice, no modifica ofertas ni postulaciones. La consulta final debe listar `job_expiry_notices`.
2. En **Workers & Pages → uadav-api-staging → Edit Code**, reemplazar el archivo completo por [worker.js](../worker.js) de esta rama y desplegarlo. Conservar `JOB_STORE_D1=true` y `JOB_STORE_MAINTENANCE=false`. Mantener los bindings actuales. No cambiar producción, rutas, dominios, cron, cola, secretos de correo ni flags de recuperación.
3. Verificar `/api/health` en el hostname de staging: **11760**, KV/D1 disponibles y correo/cola sin activar. Recargar Admin staging y esperar que termine de restaurar su sesión antes de pedir credenciales de nuevo.
4. En **Auditoría → Avisos por vencimiento de ofertas**, usar **Revisar vencimientos**. Con los datos actuales, las ofertas de QA vinculadas están cerradas: no deben reaparecer avisos para ellas. Después corresponde probar una oferta ficticia vinculada con fecha próxima y comprobar el aviso en Mi Perfil.

Si falta el SQL, se informa que la función no está preparada y no se rompe la publicación ni el acceso por comprobante. El frontend nuevo también permite seguir usando el Worker 11759: la revisión muestra un mensaje de función pendiente, sin intentar escrituras.

## Validación

**35 pruebas SQLite** aprobadas localmente: las 26 anteriores y nueve grupos nuevos. Cubren zona horaria, fechas, permisos, mantenimiento, privacidad, concurrencia, rollback, revisión desactualizada, renovación/cierre/cambio de cuenta antes del commit, 2.000 ofertas dentro del presupuesto de subsolicitudes y recuperación del historial sin avisos históricos.

**92 pruebas de Pages/Admin/aislamiento** aprobadas localmente: incluyen las ocho pruebas adicionales de revisión, confirmación, doble clic, respuestas incompletas, red incierta, salida de la vista y respaldo del historial. La validación de código y CI no equivale a despliegue o entrega remota de avisos.

Los endpoints de recuperación por correo **siguen devolviendo 503**. Este cambio no despacha correos ni prueba un proveedor transaccional. Continúan pendientes la prueba remota de los avisos, cuenta B y segundo dispositivo, restauración en una base desechable, entrega segura de correo, importaciones reales desde Admin y los dispositivos restantes. Bolsa todavía no está cerrada de punta a punta.
