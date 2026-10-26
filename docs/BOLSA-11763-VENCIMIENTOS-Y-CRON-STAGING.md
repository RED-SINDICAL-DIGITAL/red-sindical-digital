# Bolsa 11763 · vencimientos y revisión automática · staging

## Estado de la entrega

**Despliegue principal 11763 verificado** el 26/10/2026 mediante health: D1/KV detectados, correo y cola apagados. La consulta privada de estado sigue pendiente: el ingreso browserAuth no devolvió confirmación y una pestaña nueva mostró el acceso administrativo. Hace falta el ingreso manual en la pestaña de Work antes de configurar la etapa 2. No se activó un cron desde esta sesión; todavía no se observó el valor real de su flag ni una ejecución programada. El ensayo de restauración QA 11762 permanece aprobado y sin cambios. Ver `BOLSA-11763-DESPLIEGUE-VERIFICADO-20261026.md`.

La rama Worker sigue siendo `release/radio-studio-staging-rc-20261020`. Los cambios de interfaz se guardan por separado en `audit/continuidad-demo-20261019`. No se mezclan ramas ni se opera sobre producción.

## Comportamiento preparado

- El punto de entrada programado del Worker de staging llama únicamente al mantenimiento de Bolsa. No invoca mantenimiento general, push, podcasts, correo o capturadores. El programador general original no se modifica; la envoltura de staging lo sustituye por la entrada acotada.
- Está apagado por defecto. Exige el valor exacto `JOB_STAGING_CRON=bolsa-only`, `JOB_STORE_D1=true`, modo mantenimiento apagado y el cron exacto `*/15 * * * *`. Una programación distinta o un evento inválido no escribe datos.
- El día de vencimiento se calcula con el reloj real en Argentina. El tiempo del evento identifica el turno para impedir repeticiones; no modifica el reloj de las ofertas y no se añade una ruta HTTP para ejecutar el cron o adelantar fechas.
- Una lease D1 serializa ejecuciones; dura 16 minutos, por encima de la vida máxima documentada de 15 minutos de un scheduled handler. Un reintento después de una interrupción conserva la idempotencia de los avisos. La marca de un turno ya completado evita repetir ese turno o uno anterior.
- Se registran la última ejecución y el último éxito en `job_store_meta`, con fechas y conteos agregados. No se guardan títulos, correos, claves ni datos de postulantes en esos registros. La confirmación y liberación de la lease son un lote con condición de propietario comprobada dentro de la transacción.
- Si falla el aviso, su ledger y mensaje revierten juntos. El cierre de la oferta puede haberse confirmado antes; el siguiente intento conserva ese cierre y completa el aviso sin duplicarlo. Un error de ejecución se propaga al runtime con mensaje genérico; no se registra como éxito por haber iniciado la tarea.
- El mantenimiento respeta estados ocultos o cierres explícitos, `activo=0` y fechas inválidas. Conserva las candidaturas y sus datos autorizados.
- Admin → Auditoría muestra el estado automático, una revisión en curso/interrumpida y el resultado agregado de la última ejecución. **Actualizar estado automático** solo hace GET; no activa el programador ni envía avisos. La revisión manual conserva su consentimiento y confirmación previos. Un Worker anterior muestra una indicación de actualización pendiente.

No se necesita SQL nuevo: se utiliza la tabla `job_store_meta` ya instalada. No se cambian claves, bindings ni la recuperación por correo.

## Pruebas aprobadas localmente

- **73 pruebas Worker** con SQLite real: las 65 existentes y ocho grupos nuevos para el cron. Incluyen apagado por defecto, autenticación y consulta sin escrituras, aislamiento de módulos, solapamiento, fallos SQL, reintento, confirmación perdida, lease vencida, historial inválido y 2.000 ofertas con menos de 50 peticiones D1 por ejecución.
- **15 comprobaciones en workerd 1.20261025.1**: nueve del capturador, tres del adaptador QA congelado y tres del nuevo programador. Las nuevas comprueban compatibilidad, apagado/aislamiento, GET privado y propagación segura de errores; **no equivalen a un cron ni D1 remoto aprobados**.
- **138 pruebas UI**; cuatro casos nuevos verifican lectura privada, estados, respuestas inválidas/servicio anterior, clics repetidos y respuestas tardías. Compatibilidad de importación/exportación y 12 pruebas estáticas de Radio Studio aprobadas.
- El constructor del ensayo QA lee ahora el núcleo 11762 desde su ZIP inmutable y comprueba su SHA256. Su JS y ZIP desplegados no cambian al preparar 11763. No se vuelve a desplegar el ensayo aprobado.

## Paso 1 · desplegar únicamente el Worker principal de staging

1. Descargar `releases/uadav-api-staging-11763.zip` y extraer `worker.js`.
2. En Cloudflare abrir **uadav-api-staging → Edit code** y pegarlo completo. Deploy.
3. Conservar DB, KV y secretos existentes. No tocar producción ni `uadav-restore-qa`. No ejecutar migraciones, no habilitar correo o restore y no agregar todavía un cron.
4. Comprobar `https://uadav-api-staging.uadavstream.workers.dev/api/health`: **build 11763**, D1/KV disponibles, correo/cola apagados.
5. En Admin staging → Auditoría → Avisos por vencimiento de ofertas, usar **Actualizar estado automático**. Debe responder con la preparación de la base y estado desactivado, sin una ejecución confirmada. La interfaz requiere que Pages haya publicado el cambio de su rama.

SHA256 del código: `50d232f8b6e90cb54f266299b81d25c0a94af3c93687983f4389a9b0c1a0f348`.
SHA256 del ZIP: `002eb47cf583876983d1c3129649d46df6502430aed04220664a3e6409604640`.

## Paso 2 · solo después de verificar 11763 y el estado privado

En **uadav-api-staging → Settings → Variables and Secrets**, agregar una variable **Text**, nombre `JOB_STAGING_CRON`, valor exacto `bolsa-only`. Guardar y desplegar el ajuste. Los valores existentes `JOB_STORE_D1=true` y mantenimiento apagado deben conservarse; no reemplazar la configuración con la plantilla de ejemplo.

En **ese mismo Worker de staging → Settings → Triggers → Cron Triggers**, agregar la expresión exacta:

`*/15 * * * *`

No elegir una expresión equivalente con otra escritura: el handler compara la cadena exacta. No crear este trigger en producción o en el Worker de restauración. Los triggers funcionan en UTC; este patrón ejecuta cada 15 minutos y el día laboral se sigue calculando en Argentina. La propagación puede tardar hasta 15 minutos; registrar el resultado real cuando llegue, sin simularlo con una petición HTTP a la API.

La configuración por sí sola no aprueba una ejecución. Comprobar el primer evento desde Cloudflare y el resultado de **Actualizar estado automático** en Admin. La interfaz puede indicar que aún espera una ejecución confirmada si no llegó un evento.

## QA remota que sigue pendiente

- Despliegue real de 11763, primera ejecución del cron y registro privado en D1.
- Una oferta ficticia guardada voluntariamente en una cuenta y que venza con el reloj real; verificar bloqueo de postulaciones, aviso posterior visible solo a esa cuenta, candidaturas conservadas y ausencia de duplicados en el turno siguiente. No cambiar fechas previas ni el reloj para forzar la aprobación.
- Conservar una oferta cerrada u ocultada como control; el programador no debe modificar su estado.

No se da Bolsa por terminada con esta entrega. Correo transaccional, ensayo remoto del respaldo privado completo, pruebas entre cuentas/perfil artístico, fuentes reales autorizadas y dispositivos restantes siguen abiertos.

Referencias oficiales revisadas el 25/10/2026: [scheduled handler y resultado de su promesa](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/) y [Cron Triggers, UTC, configuración y propagación](https://developers.cloudflare.com/workers/configuration/cron-triggers/).

## Confirmación de GitHub y archivos publicados

Código Worker `90df7e3c6561271fa6a185f664cc17816c28266c` y Pages `cfc19c838c99be50820a81f7b6a4ca6d8f5464cd`. CI Bolsa **40263069135**, Radio **40263069094** y UI **40263077171**: success. La entrega y la observación del frontend se registran en `BOLSA-11763-ENTREGA-Y-VERIFICACION.md`. En la entrega original se observó 11762; el 26/10/2026 se confirmó 11763. Admin sigue pendiente de ingreso confirmado y no se configuró el cron desde estas sesiones.
