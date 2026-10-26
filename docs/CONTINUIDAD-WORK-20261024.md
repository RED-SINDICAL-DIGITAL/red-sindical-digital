# UADAV STREAM V11.7 · continuidad verificada en Work · 24/10/2026

## Alcance y punto de partida

Repositorio: RED-SINDICAL-DIGITAL/red-sindical-digital. Únicamente staging.
No se fusionaron ramas ni se modificó `main`.

| Entorno | Estado inicial comprobado |
| --- | --- |
| Pages | `audit/continuidad-demo-20261019`, commit `1a58266293e0c10a4be361d17179ffedb3b2aa5e` |
| Worker | `release/radio-studio-staging-rc-20261020`, commit `e43b32629cdf3cb42920351f8339c05086d211af` |
| Worker publicado | `/api/health` devuelve build **11757**, KV/D1 activos, correo y cola desactivados |
| Pages publicado | El navegador abre `https://uadav-stream-staging.pages.dev`, Bolsa muestra cinco oportunidades |
| Cloudflare | El panel redirige al inicio de sesión. No se instalaron migraciones ni variables |
| CI previo | Run `40056120973`: política de Bolsa aprobada; run `40056120964`: controles estáticos Radio aprobados |

## Código build 11758 · desplegado solo en staging

- Fuente mantenible `scripts/job-store-runtime.js`, incorporada al Worker de un solo archivo con `scripts/embed-job-store.mjs`.
- Almacenamiento D1 por registro para ofertas y postulaciones; credenciales de contratantes en tabla independiente.
- Inserción de oferta y credencial en una misma transacción. Índice único del identificador de solicitud.
- Control de versión por registro. Dos ediciones de ofertas distintas no se pisan; un conflicto revierte el lote entero.
- La postulación vuelve a comprobar dentro de la transacción la versión de la oferta consultada. Un cierre concurrente cancela el envío.
- La oferta vencida, cerrada o pendiente de revisión externa no admite postulaciones. Fechas calendario válidas y día de Argentina.
- Migración administrativa con simulación, huella del origen, mantenimiento, lotes de tres, reintentos idempotentes y comparación final completa. No borra ni reescribe KV.
- Límites de intentos atómicos en D1 para el nuevo modo. Limpieza de contadores y tokens vencidos en mantenimiento programado, sin agregar cron alguno.
- El backup incluye los registros D1 y las credenciales. La copia compatible `kv` del backup contiene el estado actual de D1, no el KV antiguo.
- Restauración de hasta cinco faltantes por operación: una transacción para ofertas y postulaciones, sin sobrescribir existentes; desactivada por defecto.
- Núcleo de recuperación: consumir token y rotar credencial en la misma transacción, con revisión y expiración. **Los dos endpoints de correo continúan devolviendo 503.**
- Las respuestas privadas no se cachean. Errores laborales sin SQL, hashes o claves en el mensaje.
- No se ejecuta el bootstrap general de D1 como requisito de una escritura laboral en el nuevo modo.
- Importación externa en modo D1: hasta cinco ofertas por lote, origen HTTPS validado e identificador determinista para evitar duplicados simultáneos.

El modo nuevo requiere **`JOB_STORE_D1=true` y una migración validada**. El usuario instaló las tablas, completó la copia de 5 ofertas y 5 postulaciones y activó D1 en staging. Después retiró mantenimiento y el navegador de Work comprobó escrituras y lecturas nuevas. El detalle y la evidencia están en `docs/BOLSA-11758-POST-DEPLOY.md`. No usarlo en producción. La protección por hostname rechaza su uso fuera del Worker staging.

## Pruebas ejecutadas localmente

`node --test tests/job-store-integration.test.mjs`: nueve grupos aprobados con SQLite real y KV simulado. Incluye concurrencia, acceso legado, dos canjes simultáneos, fallas SQL inyectadas, rollback entre colecciones, restauración repetida, cierre concurrente y migración interrumpida.

`node tests/job-application-integration.mjs`: compatibilidad KV aprobada con publicación inmediata aunque la moderación global esté activada, consentimiento, separación de ofertas, claves hasheadas, cierre, renovación y vencimiento.

`node tests/bolsa-public-policy.test.cjs`: política pública y privacidad aprobadas.

`node --test tests/job-status-contract.test.cjs`: cuatro controles aprobados.

`node scripts/test-radio-studio-hardening.mjs`: doce controles estáticos aprobados.

**Incidencia previa reproducida sin cambios:** `tests/radio-studio-integration.mjs` falla sobre una base SQLite vacía porque su preparación no instala `radio_operators`. Reproducido también con el commit inicial. No equivale a una falla confirmada del Radio Studio publicado; tampoco permite declarar aprobada su integración local.

## Lo que falta para terminar Bolsa

**Avance posterior:** el Worker 11759 y la tabla adicional ya se comprobaron mediante el circuito autenticado de una cuenta ficticia creada manualmente por el usuario. En PC de Work se probaron guardado voluntario, una postulación sin vincular, persistencia, privacidad de campos opcionales, acceso a candidatos, cierre/renovación, cambio de estado desde Admin y avisos leídos. Dos defectos detectados en Pages se corrigieron y se verificaron publicados en `43f60b7f6e49e66a95ac659124bd85bd042f1dd8`; CI `40118351789` aprobado con 84 pruebas. El usuario completó también publicación, postulación, apertura del archivo del contratante, consulta de candidatos y cierre desde el celular. Servidor y Admin corroboran la oferta `JOB-MVMT57YC-897E34406860` cerrada y su candidatura `POST-MVMT9Y4B-F51EE764` conservada con consentimiento registrado. El nuevo backup privado contiene **8 ofertas, 9 postulaciones y 2 asociaciones** consistentes; conserva la versión anterior. Las cinco ofertas públicas originales permanecen iguales. Ver `docs/BOLSA-11759-MI-PERFIL-STAGING.md` y sus capturas de evidencia.

1. Conservar el respaldo D1 posterior, ya descargado y verificado; validar restauración en una base desechable. El despliegue 11758, el esquema y la migración inicial ya se completaron en staging.
2. Probar acceso remoto con un comprobante legado de QA. El acceso de una oferta nueva y el rechazo de clave incorrecta ya fueron comprobados.
3. Probar concurrencia HTTP independiente en Cloudflare. El doble clic de la interfaz y la concurrencia local/CI están comprobados.
4. Completar casos de cuenta en móvil y repetir los circuitos en tablet/Smart TV. Publicación, postulación, consulta de candidatos por archivo, cierre y seguimiento posterior con el archivo de la candidatura fueron confirmados por el usuario desde el celular; el servidor corroboró cierre y conservación de la candidatura. En PC de Work ya se completaron publicación, postulación, privacidad, seguimiento, cierre, rechazo desde pantalla desactualizada y renovación con datos ficticios.
5. Completar el vínculo explícito con Mi Perfil en una segunda cuenta independiente, con un dispositivo aprobado y un comprobante anterior. El circuito de cuenta A ya está desplegado y validado en PC. No vincula por coincidencia de correo; conserva el seguimiento por comprobante privado.
6. Completar el circuito de entrega de correo: proveedor, token, límites, reintentos y entrega confirmada. El núcleo SQL aprobado no prueba entrega de email.
7. Completar el aviso remoto posterior al vencimiento y verificar la ejecución programada real, entrega externa de notificaciones, importación desde Admin y restauración. **El aviso próximo a vencer de 11760 ya pasó QA real**: oferta `JOB-MVN0OQA5-28B033C1422D` vinculada, candidatura `POST-MVN0P9GO-56F2C26E` sin guardar, un aviso interno entregado y leído, repetición con cero pendientes, renovación hasta 2026-11-23 y cierre final con candidatura conservada. La Bolsa pública conserva las cinco ofertas originales. El respaldo de ese ensayo fue 11760 con 9 ofertas y 10 postulaciones, versión 2. Después de la QA de importaciones, el respaldo actual conserva **11 ofertas, 10 postulaciones, 3 vínculos y 1 marca de aviso**, consistente y guardado como versión 3 del mismo archivo privado. El alta de la cuenta de esta sesión la completó el usuario. Worker fuente `83f8cb307260d0d105f1ff6d7ed9f6a14a139006`, CI Bolsa `40134086445`; no cambió. Pages corrigió también el error silencioso al guardar una oferta y el identificador requerido para crearla: `1ab6a4f8b6acc15199a72f09f1007ef4bbb50eb0`, CI `40142314409`, **100 pruebas**. Publicación y rechazo visible/guardado válido comprobados. El editor rechaza fechas pasadas: este ensayo no valida el aviso posterior al vencimiento ni un cron. Correo y cola siguen apagados. Ver `docs/BOLSA-11760-AVISOS-STAGING.md`.

8. **Importación CSV real ya verificada con datos sintéticos.** Se corrigieron la visibilidad ignorada, la posible duplicación por ausencia de ID y la pérdida de origen externo de la ruta genérica. Pages usa ahora la ruta externa existente con URL como identidad y hasta cinco ofertas por lote. El CSV inicial reveló conversión de fecha a número y acentos incorrectos antes de escribir; se corrigió el lector y se reemplazó SheetJS 0.18.5 por distribución oficial 0.20.3 local. Pages `9967c6c038f8ad0725ce4825adbd31f3a0b8d339`, CI `40143976001`, **120 pruebas aprobadas** y control de importación/exportación. Se incorporó una oferta oculta, repetirla dio cero nuevas y una actualización, se publicó otra con etiqueta externa y su botón abrió el origen correcto. Ambas quedaron ocultas y el catálogo conserva cinco ofertas. No se valida con esto scraping o descubrimiento automático. Ver `docs/BOLSA-11760-IMPORTACIONES-QA.md`. Las guías pública e interna se actualizaron en la rama Pages. Quedan por armonizar en Worker las validaciones de fechas que todavía comparan con el día UTC, además de los pendientes de restauración, correo y dispositivos.


**Auditoría ampliada de Pages:** todos los `*.test.cjs` arrojaron 509/555 aprobadas y 46 fallas, reproducidas también en el commit base `0075f41` sin los últimos ajustes visuales. Mantener este pendiente de otros módulos separado de las 84 pruebas específicas aprobadas. No afirmar que toda la plataforma pasa las pruebas.

**Bolsa todavía no está terminada ni validada de punta a punta.** Cartelera queda después de esta puerta de salida. No hay despliegue productivo autorizado.

Documentación técnica utilizada: https://developers.cloudflare.com/d1/worker-api/d1-database/ y https://developers.cloudflare.com/d1/platform/limits/.

## Entrega siguiente preparada: 11761

El usuario pidió continuar. Se prepararon correcciones de fechas de Argentina (incluido plazo por defecto/renovación), captura de fuentes con controles DNS/redirección/tamaño/tiempo e identidad externa segura, con conservación de cierres y guardas transaccionales. Admin unifica la revisión por URL y candidato, conserva el borrador y exige un Worker nuevo antes de consultar HTML. Fuente sintética propia lista para el ensayo. Ver `BOLSA-11761-FECHAS-Y-FUENTES-STAGING.md`.

Al iniciar esta entrega el navegador observó todavía 11760, correo y cola apagados. El despliegue 11761 es manual y no requiere SQL, flags o credenciales nuevas. El respaldo de datos verificado sigue siendo 11760 versión 3. No se modificó producción. La consulta DNS previa no equivale a pinning de la conexión: la seguridad productiva de ese egreso sigue pendiente.


**Entrega registrada:** Worker código `dab7e96fd0a71553e91bcc093329fde966b9e418` (54 pruebas y CI Bolsa/Radio verdes); Pages `fcb77c56fcddfc7136f05748aea532756c415958` (132 pruebas y CI verde), desplegado y cotejado por manifiesto. Worker remoto todavía **11760** a las 23:34 del 24 de octubre en Argentina; ZIP 11761 verificado y despliegue manual pendiente. No hubo escritura de datos remotos. Ver `BOLSA-11761-ENTREGA-20261024.md`.


## Verificación real del 25 de octubre: 11761 desplegado

Health confirma 11761 a las 17:19 de Argentina, D1/KV disponibles, correo y cola apagados. Público conserva cinco ofertas y se restableció Admin de forma segura. La lectura por URL falló tanto en la fuente sintética Pages como en la página pública del propio repositorio; no hubo incorporación ni otras escrituras de Bolsa. Causa sin determinar: no atribuirla a Cloudflare o DNS ni dar por validado el capturador. Quedan seis bloques de cierre detallados en `BOLSA-ESTADO-Y-CIERRE-20261025.md`, con estimación provisional de 3–5 jornadas efectivas condicionadas a accesos/proveedor/dispositivos. No se habilitó correo, restauración, cron ni producción.


## 11762 preparada: corrección reproducida en workerd y ensayo del respaldo

Se encontró una incompatibilidad concreta: `redirect: "error"` de la consulta DNS es rechazado por workerd. 11762 usa manual y rechaza 3xx, sin relajar la política. 57 pruebas Worker, nueve comprobaciones del motor, 134 Pages y controles adicionales locales aprobados. Se ensayó el respaldo privado versión 3 en SQLite en memoria: 11 ofertas, 10 postulaciones, 6 credenciales, 3 vínculos y 1 ledger, cotejo íntegro, repetición e interrupción/reintento correctos. No equivale a D1 remoto. Miniflare local no produjo prueba utilizable y no se cuenta como aprobado. Nuevo script de ensayo no contiene datos privados. Worker remoto sigue observado en 11761; ZIP 11762 verificado, despliegue manual pendiente. Pages exige 11762 para capturar y normaliza identidad CSV como el Worker. Ver `BOLSA-11762-CAPTURA-Y-RESPALDO-STAGING.md`. Producción, correo, restore y cron sin cambios.


**Cierre de entrega 11762:** código Worker `a98be118050af80c3325c1a7f01f3ee966b6c747`, CI Bolsa 40233822004 y Radio 40233822014 verdes. Pages `e90f40a8b80d25bbaf8e1722d5b9a1d27884632c`, CI 40233847181 verde, manifiesto y guía publicados comprobados. Health remoto todavía 11761 a las 18:07 del 25/10 en Argentina; falta un despliegue manual del ZIP 11762 sin SQL o variables. No se escribieron ofertas/postulaciones remotas. Ver `BOLSA-11762-ENTREGA-20261025.md`.


## 25/10: captura 11762 validada y ensayo D1 independiente preparado

Health 11762 confirmado a las 18:30 de Argentina. Captura por URL completada en Admin: ficha `JOB-EXT-93C1A556`, revisión con acentos y fecha 2026-11-24, publicada como externa, origen correcto, repetición sin duplicar, ocultamiento y reimportación con fragmento que no la reactiva. El catálogo conserva cinco ofertas originales. 12 ofertas/10 postulaciones/22 registros; seis credenciales, tres vínculos y un ledger sin cambios. Respaldo privado versión 4, 262907 bytes, SHA256 `699d2fc97626d0b7562043626f8655d9cb3293dc118b42d9d6f829f4d0db7968`, mismo archivo e historial, cotejo de los 21 registros previos exacto. Ensayo local del archivo nuevo también aprobado. Ver `BOLSA-11762-CAPTURA-QA-20261025.md`.

Se dejó preparado un Worker de restauración QA aparte, compilado desde el core actual pero con entrypoint externo restringido, D1 vacía y secreto propios. Usa solo datos ficticios, llama internamente al handler original con la base desechable y no contacta por HTTP al staging. Rechaza bases con datos y comprueba ese vacío dentro del batch de inicialización; prueba bloqueo, restauración, idempotencia, rollback, reintento e integridad en seis pasos. Ocho pruebas nuevas aprobadas localmente: total 65, más doce comprobaciones en workerd. Su despliegue exige recursos nuevos `uadav-restore-qa` y `uadav-bolsa-restore-qa`. El Worker real de staging sigue en 11762 y no se vuelve a reemplazar. Ver la guía desechable. Correo, restore actual, cron y producción siguen sin cambios.

### Confirmación de GitHub para el siguiente paso

Adaptador y QA guardados en `37e1cfbd9c10c7a8800d4a38b0b4b3ada0623f64`. CI Bolsa **40238857214** y Radio **40238857246**: **success**. El código principal sigue intacto. Continuar por `docs/BOLSA-11762-RESTAURACION-D1-DESECHABLE.md`: creación manual de **Worker y D1 nuevos**, no reemplazar staging. Todavía no hay URL de Visit verificada ni prueba D1 remota del adaptador. La sesión Admin queda preservada en Auditoría con el respaldo 12/10 ya confirmado; no generar otra migración ni habilitar correo.

### Worker QA desplegado; configuración de clave pendiente · 25/10/2026

URL proporcionada y observada: https://uadav-restore-qa.uadavstream.workers.dev/. Health: `11762-restore-qa-1`, núcleo SHA256 `94e6603f4f9d44f6cfaa6f152c4670f27335ef9fdd7c52e90c3985b4ecdaab98`, modo QA y binding DB presentes. Un único intento de acceso seguro devolvió el error de configuración de `QA_RESTORE_KEY` (variable ausente o longitud fuera de 32–256). No se consultó ni preparó D1 y no se ejecutaron las seis fases; la identidad/vacío de la base siguen sin comprobar. Corregir solo el Secret del Worker nuevo, guardar y desplegar; después retomar browserAuth sin pedir la clave en el chat. Sesiones Admin y QA preservadas. Main y Pages siguen en sus SHAs anteriores. Ver guía `BOLSA-11762-RESTAURACION-D1-DESECHABLE.md` y su evidencia. No volver a solicitar un despliegue del Worker principal.

### QA D1 remoto aprobado; Secret corregido · 25/10/2026

El usuario confirmó HECHO, se completó browserAuth en la pestaña QA preservada y la interfaz confirmó base vacía. Se preparó el esquema y se ejecutaron las seis fases: todas aprobaron en D1 de Cloudflare. Conteos exigidos por el código: 2 ofertas, 2 postulaciones, 2 credenciales, 4 vínculos, 2 marcas de aviso, todos ficticios. Se probó rollback real e idempotencia; no se subió el respaldo privado ni se habilitó restore en staging. El bloqueo anterior de clave está resuelto. Evidencia y alcance: `BOLSA-11762-RESTAURACION-QA-APROBADA-20261025.md` y `evidence/bolsa-restore-qa-11762-resultado-20261025.json`.

Health del Worker principal a las 20:13 de Argentina: 11762, D1/KV OK, correo/cola apagados. No cambió código de ejecución en este paso. Conservar Admin como handoff; QA completada es entregable. El siguiente bloque es vencimientos/avisos: se detectó que el `scheduled` actual dispara también mantenimiento general, push y podcasts; aislar el alcance antes de cualquier cron nuevo. No se configuró ninguno. El respaldo privado versión 4 sigue siendo el último cotejado; no generar una nueva migración por este ensayo separado. La lectura del portapapeles de control fue vacía pese al éxito visible del botón; no fingir que se obtuvo su JSON exportado.

### Entrega 11763 preparada · programador de Bolsa y estado Admin

Código de ejecución 11763 preparado, no desplegado. La envoltura de staging sustituye el scheduled compartido por una entrada exclusiva de Bolsa, apagada salvo `JOB_STAGING_CRON=bolsa-only` y cron exacto `*/15 * * * *`, con JOB_STORE_D1 true y mantenimiento apagado. Usa lease D1 de 16 minutos y registros agregados en job_store_meta; no requiere migración. El endpoint Admin `/api/admin/jobs/cron` es solo GET, protegido y exclusivo del hostname de staging. No hay disparador HTTP ni reloj de prueba.

Pruebas locales aprobadas: 73 Worker, 138 UI, 15 workerd y 12 estáticas Radio. Se corrigieron cierres/ocultamientos, activo=0 y fechas inválidas en mantenimiento. Se conservaron sin cambios los archivos QA 11762: el constructor lee el núcleo archivado y exige su SHA. Pages cambia por separado el componente de avisos, su versión de caché y la guía pública.

Siguiente intervención: desplegar únicamente ZIP `uadav-api-staging-11763.zip` en **uadav-api-staging**, conservando bindings y secretos; verificar health 11763 y GET de estado desactivado. No configurar todavía flag/cron en 11762 ni tocar el Worker de restauración. Solo después de verificar el código real seguir el paso 2 de `BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md`. Faltan primera ejecución programada y vencimiento real, entre otras puertas de cierre.

### 11763 en GitHub; despliegue pendiente y sesión Admin sin confirmar

Worker: `90df7e3c6561271fa6a185f664cc17816c28266c`; Pages: `cfc19c838c99be50820a81f7b6a4ca6d8f5464cd`. CI Bolsa 40263069135, Radio 40263069094 y UI 40263077171: success. Descargas permanentes, hashes y evidencia en `BOLSA-11763-ENTREGA-Y-VERIFICACION.md`. El frontend público cargó la versión 11763.1 del componente y la guía actualizada; no se verificó el panel privado autenticado.

El contexto del navegador se reinició y perdió las pestañas anteriores. Un único intento browserAuth de Admin no devolvió confirmación; una pestaña nueva mostró el login. No asumir éxito, clave incorrecta o anti-bot. No repetir la solicitud en esta entrega ni cambiar claves por caducidad. Queda abierta la pestaña Admin como handoff para el próximo ingreso seguro; no leer storage/secretos. Los nombres antiguos check11761Admin/restoreQa11762Tab ya no existen. El nombre nuevo vigente es cron11763AdminCheck, pestaña 1, en /admin?section=audit; la guía pública quedó como entregable.

Health principal observado con marca `2026-10-26T07:08:49.687Z`: 11762, D1/KV OK, email_automation/queue false. El siguiente pedido al usuario es únicamente desplegar el ZIP 11763 en uadav-api-staging, sin cron ni nuevos flags todavía. Después confirmar health 11763, ingreso seguro Admin y estado read-only desactivado antes de configurar la segunda etapa. No tocar el Worker QA ya aprobado, producción, correo o restore. No repetir las pruebas completas locales por cambios de documentación.

### 11763 ya desplegado; ingreso manual Admin necesario · 26/10/2026

El usuario informó desplegado. Health observado `2026-10-26T15:48:31.957Z` (12:48 Argentina): build11763, D1/KV detectados, email_automation y queue false. La navegación sin credenciales a /api/admin/jobs/cron mostró No autorizado. No se obtuvo el estado privado ni se configuró cron. Ver `BOLSA-11763-DESPLIEGUE-VERIFICADO-20261026.md` y su JSON de observación.

Una solicitud browserAuth para Admin volvió a terminar sin confirmación por timeout. No asumir clave errónea, ausencia de entrada o bloqueo anti-bot. El contexto se perdió; la recuperación abrió una pestaña nueva en la URL canónica y mostró login con API disponible. No repetir más solicitudes automáticas para este bloqueo: se prepara control manual de la pestaña de Work para que el usuario ingrese la clave habitual y deje Auditoría abierta. No pedir la clave en el chat ni cambiarla, no crear cuentas. La pestaña actual es deployed11763Admin (id1). El ingreso/estado del cron siguen pendientes; no pedir otro despliegue de 11763 si health conserva ese build.

La etapa siguiente sigue siendo leer Actualizar estado automático: preparación, mantenimiento, habilitación y último resultado. Solo tras comprobarlo corresponde configurar la etapa2 del cron exclusivo. No dar por observado su flag solo por el default del código. Producción, Worker de restauración QA y respaldo privado permanecen fuera de estas operaciones. No hay código de ejecución nuevo ni SQL que aplicar.

### Acceso Admin resuelto y estado privado aprobado · 26/10/2026

El usuario no pudo usar el control manual en la nube y pidió explícitamente volver al ingreso aquí, consultando por un TXT. No se solicitó ni recibió la clave por archivo/chat. Ese pedido explícito habilitó un nuevo browserAuth sobre la pestaña preservada deployed11763Admin (id1). Resultado submitted, seguido de observación positiva Administrador/Sesión central, Auditoría y banner staging. El bloqueo anterior no sigue pendiente: no repetir otro pedido de clave mientras la sesión sea válida.

Se pulsó únicamente Actualizar estado automático (GET). Resultado visible: La revisión automática está desactivada. Todavía no hay una ejecución confirmada. Según el contrato publicado 11763.1, indica ready true, paused/enabled/running/interrupted false y last_run null; son inferencias del mensaje renderizado, no JSON extraído del navegador. No se inspeccionaron storage, cookies o valores secretos. Evidencia guardada a las 13:52 Argentina en evidence/bolsa-11763-admin-autenticado-20261026.jpg; reporte y JSON de despliegue actualizados.

Siguiente intervención: etapa2 de BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md, configuración manual exclusiva de uadav-api-staging: variable Text JOB_STAGING_CRON=bolsa-only y Cron Trigger exacto */15 * * * *. No se observaron los triggers en el dashboard; desactivado no demuestra que no exista uno. Conservar DB/KV, JOB_STORE_D1=true y mantenimiento apagado. Después comprobar un evento real y recibo Admin; no simularlo por HTTP ni adelantar el reloj. No volver a desplegar 11763, aplicar SQL o tocar QA restore. No hubo envíos de avisos ni cambios de producción, correo, backup o credenciales. Bolsa sigue abierta por los bloques del estado y cierre.

### Cron de Bolsa con primer recibo exitoso y respaldo Admin simplificado · 26/10/2026

El usuario informó HECHO después de la etapa2. Se conservó deployed11763Admin (id1) autenticado y se actualizó solo el estado automático por GET. Primero figuró activada sin ejecución; a las 14:17 Argentina se observó último turno exitoso de las 14:15: 0 ofertas actualizadas, 0 avisos privados. Recibo D1 interpretado por UI11763.1; no se extrajo JSON privado, hora UTC exacta o secretos y no se inspeccionó Cloudflare/Past Events. No atribuir a Work la configuración hecha manualmente por el usuario. No repetir clave, flag, trigger o despliegue por el bloqueo anterior. Health 2026-10-26T17:09:55.540Z: 11763, D1/KV detectados, correo/cola false.

Mientras se esperaba el primer turno, se corrigió una confusión de Auditoría: el panel de respaldo mostraba SQL y casillas de migración antes de conocer el origen actual. Pages b59c803f7b2e33575c4d1c5e4d227b9689be01fa, recurso11763.2: arranque neutral; SQL, confirmaciones y botones de copia solo tras verificar fuente KV. Controlador sin cambios byte por byte. 138 UI e import/export locales aprobados; CI40365969241 success. Interfaz inicial publicada y botones ocultos comprobados tras reload, sesión conservada; no se repitió una descarga privada para este ajuste. El componente cron sigue11763.1. No cambió runtime Worker ni SQL.

Evidencia y límites en BOLSA-11763-CRON-PRIMERA-EJECUCION-20261026.md y su JSON/captura. Procedimiento BOLSA-11763-QA-VENCIMIENTO-REAL.md preparado para nueva oferta con Publicación visible hasta el día real permitido y guardado voluntario en la cuenta QA. Oferta/candidatura todavía no creadas; publicación con nuevo comprobante privado queda en manos del operador. El campo Fecha es distinto del vencimiento. Falta cierre real, aviso posterior, candidatura preservada e idempotencia en turnos posteriores; cero cambios en el primer turno no los acredita. No adelantar reloj ni modificar fechas previas. Correo, restore operativo, producción, restoreQA y backup privado sin cambios. No mover a Cartelera todavía.

### QA publicada, candidatura consentida y primer aviso automático real · 26/10/2026

El usuario informó PUBLICADA. Se observó catálogo público de seis ofertas (las cinco anteriores más la QA) y filtro QA11763 con una coincidencia. Oferta JOB-MVPJ9WRW-439D4126D9AE, título QA11763 Vencimiento real NO CONTRATAR, fecha y fecha_limite 2026-10-26, activa. Candidatura POST-MVPJCNGX-E7683EC0 recibida, consent_scope job_application_v1 y consent_at 2026-10-26T17:33:39.921Z. Ambas guardadas en una misma cuenta ya existente, distinta de la QA previamente vinculada. No hay vínculo artístico verificado en esta candidatura. No se creó una cuenta ni se vinculó un dispositivo de Work.

A las 14:45 Argentina, cron success: processed0/emitted1/recorded1. Respaldo confirma un marcador soon y un mensaje para la misma cuenta de la oferta, creado 17:45:40.988Z. No se marcó consentimiento ni se envió manualmente desde Admin. Revisión GET posterior: sin avisos pendientes. Mi Perfil de Work está sin vincular; se abrió Configuración para conocer el ingreso existente, pero no se inició un emparejamiento ni se expuso un QR/código. Falta ver el mensaje en el dispositivo destinatario y comprobar el siguiente turno sin duplicados; no afirmar esos pasos aprobados.

Backup privado actualizado como versión5 del mismo archivo UADAV-STAGING-11759-respaldo-20261024.json, identidad privada conservada; bytes268315, SHA2562865eefe5a91145ab459743580e51ec760b4c117c95abe3396988966974a9442, generado17:47:23.903Z. 13ofertas/11postulaciones/24registros, 7credenciales, 5vínculos, 2ledger. Los22registros anteriores y tablas de seguridad previas sin diferencias; oferta/candidatura nuevas idénticas antes/después del aviso. Verificador existente aprobado y ensayo offline con red bloqueada:6lotes, repetición, rollback/reintento, integridadOK. remote_d1_validated=false para este backup real. Metadata/xattrs de versión5 aplicados; no volver a guardar como archivo nuevo ni publicar su contenido. El backup v4 persiste en historial y checkpoint privado.

Ahora la nueva UI11763.2 también se verificó después de exportar D1 real: título y conteos correctos, SQL/casillas/copia ocultos. Sin nuevo código runtime ni despliegue. Evidencia en BOLSA-11763-AVISO-AUTOMATICO-QA-20261026.md y JSON/capturas. Siguiente ensayo desde27/10 00:00 Argentina (03:00Z), sin cambiar la fecha de esta oferta: cierre, rechazo de postulaciones nuevas, candidatura preservada y aviso posterior único. No volver a publicar QA, pedir Worker, reconfigurar cron o cambiar claves por esos bloqueos resueltos. Producción, correo, cola y restore operativo/QA permanecen fuera de estas acciones. No avanzar a Cartelera aún.

Confirmación posterior del mismo ensayo: GET Admin observado 2026-10-26T18:01:24.939Z, último turno15:00 Argentina success, 0ofertas/0avisos. El aviso soon de14:45 no se reemitió en el siguiente turno real. Esa puerta ya aprobó; no repetir una espera de cron para este aviso como si siguiera pendiente. El backup v5 es la copia de14:47 con el primer recibo; la hora del siguiente se verificó en UI, sin una tercera exportación. Faltan visualización en la cuenta destinataria, cierre/aviso posterior desde27/10 00:00 Argentina y el resto de las puertas de cierre.

### Aviso visible en PC aprobado y hora argentina explícita · 26/10/2026

El usuario confirmó aviso visible y adjuntó imagen; se inspeccionó por su ruta local, sin usar Library read ni modificar el original. Mi Perfil staging muestra dos avisos nuevos: uno de oferta próxima a vencer (fecha límite2026-10-26) y otro de postulación recibida. Son hechos distintos, no un duplicado. Visualización en PC aprobada; no pedirla otra vez como pendiente ni crear una cuenta para observarla. No hubo marcado de leído o nueva vinculación desde Work. La captura original privada no se copia a GitHub; SHA2562e6350b1d89c997cd7a1f4850b75a1c6e6a02322ea5363396c1e26255cd10ddc,462591bytes.

Se detectaron horas ambiguas 02:45:40/02:33:40 sin AM/PM. Pages7e16b2a815a218df870d7375ae565af6893afa70 fija America/Argentina/Buenos_Aires y hourCycle h23, fecha completa, segundos y etiqueta hora argentina. Recurso uadav-account-notices-v148.js?v=11763.3 observado en el HTML publicado. 138 UI, control existente de avisos entre cuentas, import/export, sintaxis y diff aprobados; CI40376703081 success. Ejemplos fuera de zona local:17:45Z->14:45:40,03:00Z->00:00:00. La nueva hora en el dispositivo del usuario no se volvió a observar; recargar sirve la nueva versión. Solo frontend/CI; sin Worker o Cloudflare nuevos.

Registros BOLSA-11763-AVISO-VISIBLE-20261026.md y evidence/bolsa-11763-vencimiento-real-20261026.json actualizados. Worker sigue11763, último backup privado verificado versión5,13/11, sin nueva exportación por la captura. Mantener fecha y oferta actual hasta el27/10 00:00 Argentina (03:00Z), luego comprobar cierre/rechazo/postulación preservada/aviso posterior e idempotencia. El aviso previo y su repetición a15:00 ya aprobaron. Correo, restore operativo, producción y resto de puertas mantienen sus límites. No mover a Cartelera todavía.

### 11764 preparada: cuenta/perfil artístico y laboratorio separado · 26/10/2026

El usuario autorizó adelantar todo lo posible hasta poder cerrar Bolsa. Se recuperó contexto: no hay proveedor/remitente de correo ni fuente externa real autorizada seleccionados. Se contrastaron ambas ramas y main: Worker369e6b5, Pages7e16b2a, mainfd9799c; producción fuera de alcance.

La nueva prueba encontró que una credencial artística válida de A podía usarse al guardar una postulación en B. Worker11764 exige coincidencia entre access.account_id y accountIdentity.accountId cuando save_to_account=true. Token ajeno o antiguo sin cuenta:403 sin postulación/vínculo/aviso. Perfil propio y envío público sin guardado continúan aprobados. Solo cambian BUILD y esa condición; no SQL, cron o fechas. ZIP11764 preparado, SHA del Worker c98d9c5bcffec76beb68fb4075f8b967c019667923c425081d794191f0cff90f. El último despliegue observado sigue11763: no atribuir 11764 a Cloudflare hasta health y ejecución comprobados.

Laboratorio nuevo uadav-bolsa-lab /11764-bolsa-lab-1 con D1 nueva uadav-bolsa-lab, bindingDB, Text QA_BOLSA_ONLY=true y Secret QA_BOLSA_KEY exclusivo32–256. No usar uadav-restore-qa, su base o su clave. Núcleo congelado del ZIP11764, entrada pública de plataforma y scheduled eliminados. Rechaza bases no vacías, hostname ajeno, datos ajenos y cambio de secreto. Interfaz envía sondas HTTP separadas con coordinación D1 y devuelve solo resultados seguros. Ocho fases: publicación/app simultáneas, aislamiento/consentimiento/artista, recibo entre dos cuentas, revocación durante lote, un solo canje, rollback/reintento y límite atómico/integridad. Las dos cuentas son fixtures del laboratorio, no nuevas cuentas de usuario por sesión caducada. Ninguna lectura o escritura sobre DB operativa.

82 pruebas Node/SQLite,18workerd,12Radio,KV/política pública/fuentes embebidas/restauración congelada/sintaxis/ZIP/diff aprobados localmente. No se repitieron138UI sin cambios Pages. La suite general conserva46fallos previos ajenos. No hay prueba D1 remota de este laboratorio ni emisión/entrega de correo. Una pérdida de respuesta de sonda no se convierte en aprobación. Guía exacta, artefactos, hashes y límites en BOLSA-11764-PRIVACIDAD-Y-LABORATORIO.md. Workflow amplía cobertura del laboratorio y su ZIP.

Cloudflare en Work abrió la pantalla Sign in, sin sesión de dashboard y sin evidencia de bloqueo de bots. Se preparó browserAuth para eventual ingreso seguro. No ingresar secretos por chat/TXT ni mediante APIs de escritura del navegador; si no hay ingreso, entregar la guía manual. Mantener oferta/candidatura QA y fecha actual, cron existente, backup privado v5 sin otra exportación, correo503 y restore operativo cerrado. Siguen seis puertas de cierre; no mover a Cartelera ni decir Bolsa completa.
