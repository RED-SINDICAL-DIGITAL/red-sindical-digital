# Bolsa 11760 · avisos de vencimiento · solo staging

## Estado de la entrega

Código en `release/radio-studio-staging-rc-20261020`. El frontend está en `audit/continuidad-demo-20261019`. No fusionar ramas ni aplicar estos cambios en producción. **El usuario completó el paso manual y el navegador verificó el Worker 11760 y la revisión de vencimientos operativa.** El aviso próximo a vencer se entregó a una cuenta ficticia y se comprobaron deduplicación, lectura, renovación y cierre. El aviso de una oferta cuyo día límite ya pasó y la ejecución real del cron siguen pendientes.

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

Los endpoints de recuperación por correo **siguen devolviendo 503**. Este cambio no despacha correos ni prueba un proveedor transaccional. Continúan pendientes el aviso remoto posterior al vencimiento, aislamiento entre cuentas con credenciales independientes y segundo dispositivo, restauración en una base desechable, entrega segura de correo, importaciones reales desde Admin y los dispositivos restantes. Bolsa todavía no está cerrada de punta a punta.

## Registro previo al despliegue del Worker 11760

- Fuente Worker: `83f8cb307260d0d105f1ff6d7ed9f6a14a139006`. CI Bolsa `40134086445` y controles de Radio `40134086349`: aprobados.
- Pages publicado: `03d985688d72ae3a9c2dd7c6ad5b37a90f0f21e7`, confirmado por `staging-build.json`. CI `40135267258`: 92 pruebas aprobadas. Módulo de avisos con versión de caché `11760.1`.
- El navegador de Work comprobó la carga autenticada del módulo en Auditoría. Una respuesta que no corresponde a la revisión esperada del Worker anterior se rechaza: aparece «Los avisos de vencimiento no están disponibles. Volvé a revisar más tarde.» y el envío permanece deshabilitado. Se añadió cobertura de respuestas legadas vacías además del caso 404. No se envió ningún aviso real.
- El comprobador de respaldos nuevo sigue aceptando el export actual de 11759: se generó y descargó un respaldo de compatibilidad con 8 ofertas y 9 postulaciones, origen D1, sin repetir la migración. El JSON privado no se incorpora al repositorio.
- Health del Worker observado: **11759**, KV/D1 disponibles, correo y cola desactivados. El SQL adicional y el despliegue 11760 no fueron aplicados por el asistente. Siguen pendientes la instalación manual y la prueba de emisión real.

[Panel publicado con el envío bloqueado mientras falta el nuevo Worker](evidence/bolsa-11760-panel-pendiente-worker-20261024.jpg).

Este registro posterior solo agrega documentación y evidencia; no cambia el archivo Worker aprobado ni requiere otro despliegue.

## Confirmación del despliegue 11760 · 24/10/2026

El usuario confirmó instalar el SQL y desplegar el Worker. El navegador observó `/api/health`: build **11760**, KV/D1 disponibles, `email_automation:false` y `queue:false`. La revisión autenticada desde Admin devolvió «No hay avisos pendientes para las cuentas vinculadas». Esto confirma que el esquema adicional y las tablas de cuenta requeridas se reconocen; no se detectó un error de instalación.

No se emitieron avisos en esta comprobación. Las ofertas anteriores de QA siguen cerradas y no se creó otra oferta sin cuenta. El siguiente ensayo necesita una oferta ficticia guardada en una cuenta para comprobar aviso próximo, deduplicación y aviso de vencimiento, y terminar con el registro cerrado.

En esa primera comprobación, la sesión de Mi Perfil del navegador de Work no tenía una cuenta vinculada. Se preparó únicamente el nombre local «QA Avisos 11760 · Ficticio», se abrió Configuración y dispositivos y se dejó habilitado **Crear mi cuenta**. El alta debe completarla el usuario mediante el control manual del navegador; no se generaron ni inspeccionaron credenciales. Después hay que comprobar el estado autenticado y la lista de Mis trabajos antes de publicar el ensayo.

[Pantalla de alta preparada con datos ficticios](evidence/bolsa-11760-cuenta-qa-preparada-20261024.jpg).

Esta intervención es para la cuenta personal de pruebas, no para iniciar recuperación por correo. Los endpoints de correo siguen bloqueados. El esquema y el Worker no necesitan repetirse para continuar esta QA.

## QA real de aviso próximo · 24/10/2026

El usuario completó el alta manual de «QA Avisos 11760 · Ficticio» después de reabrir una sesión caducada. La sesión mostró una cuenta vinculada y cero gestiones iniciales. El diálogo del respaldo privado se cerró sin inspeccionar su código.

- Se publicó `JOB-MVN0OQA5-28B033C1422D`, «QA 11760 · Avisos de vencimiento · 24-10», con plazo 2026-10-24 y guardado explícito en Mi Perfil. Quedó pública de inmediato.
- Se envió `POST-MVN0P9GO-56F2C26E` con consentimiento y sin guardarla en la cuenta. Los campos opcionales quedaron vacíos. El contratante vio una candidatura «Recibida» en su acceso privado.
- Admin revisó exactamente un aviso «Por vencer» y, después de la confirmación, informó un aviso generado. Mi Perfil mostró el aviso y el de nueva candidatura. Una revisión nueva devolvió cero pendientes. Marcar leídos persistió.
- El intento de poner un plazo anterior al día actual fue rechazado por el servidor. El Admin anterior dejaba el error sin mostrar; se corrigió en la rama Pages con `1ab6a4f8b6acc15199a72f09f1007ef4bbb50eb0`. CI `40142314409`: **100 pruebas aprobadas**. El manifest publicado confirmó ese commit. La repetición remota mostró el rechazo en el formulario, conservó el borrador y habilitó un guardado válido. No se relajó la validación del Worker para fabricar un vencimiento.
- Renovar dio vigencia hasta 2026-11-23. El acceso privado conservó la candidatura. Se cerró la oferta y se volvió a comprobar «Cerrada» con candidatura «Recibida». La Bolsa pública volvió a las cinco ofertas originales, sin el ensayo.
- La revisión final no tuvo pendientes. El respaldo posterior de 11760 contiene **9 ofertas, 10 postulaciones, 3 vínculos y 1 marca de aviso próximo**; la marca, el aviso visible y la lectura son consistentes. Coinciden los 19 registros del export lógico con D1 y sus credenciales separadas. Tamaño: 251.506 bytes; SHA-256 `61f75c56f1b50bcd29ed097cf5d93f0b992a2613167480db7214cd9425c08395`. El archivo privado conserva su identidad e historial, ahora versión 2. No se incorpora a git.

[Oferta cerrada y postulación conservada](evidence/bolsa-11760-cierre-y-postulacion-verificados-20261024.jpg).

El aviso **posterior al vencimiento** está cubierto localmente/CI, pero este ensayo remoto no lo acredita: el editor impide fechas pasadas. Tampoco acredita ejecución automática, entrega por correo/push, dos conexiones HTTP simultáneas, restauración remota o el acceso de un segundo dispositivo. La cuenta actual no vio las gestiones de la cuenta de QA previa; la suplantación con dos sesiones independientes aún debe probarse. No se habilitaron correos ni restauración y no se cambió producción.

## Respaldo posterior a las importaciones

El ensayo posterior de planillas se registra en [BOLSA-11760-IMPORTACIONES-QA.md](BOLSA-11760-IMPORTACIONES-QA.md). El respaldo más reciente ya es la versión 3: 11 ofertas, 10 postulaciones, tres vínculos y la misma única marca de aviso. Las dos importaciones ficticias quedaron ocultas y las cinco ofertas públicas originales permanecen iguales. El backup de nueve ofertas descrito arriba se conserva como versión histórica de la fase de avisos.
