# UADAV STREAM · Admin 2.0 — auditoría de integración y validación antes de publicar

Fecha: 21 de noviembre de 2026  
Rama: `feature/admin-simple-navigation-20261121` · PR #68 · Issue #67  
**Estado: NO APTO PARA PRODUCCIÓN hasta completar las puertas de salida.**

## Evidencia automática confirmada para commit 40ca15f
- Admin 2.0 regression checks: **PASS**
- Platform integration checks: **PASS**
- Staging integration offline visual QA: **PASS**
- Bolsa UI staging checks: **PASS**
- Job status contract checks: **PASS**
- Staging integration preservation checks: **FAIL — esperado**: la rama cambia `worker.js`, por lo que el hash no coincide con el Worker congelado `d4b68445e67b754b811b93d84a9b7225233e67b3`.

Este último resultado **no se arregla actualizando el hash del test**. Exige revisar el impacto del cambio, las migraciones y el procedimiento de rollback.

## Inventario de cambios relevantes

### Admin y Mi Perfil
- Menú reorganizado en 7 grupos. Los 35 destinos originales siguen presentes.
- Alta directa de artistas autenticados: se conserva la publicación sin aprobación manual previa; las reclamaciones históricas quedan diferenciadas.
- Mensaje de acceso a eventos: no afirma verificación de email donde se usa una credencial privada.

### Notificaciones
- Identificador de aviso con UUID.
- En payload enviado se fuerza `notification_id` generado por el servidor.
- Si el webhook acepta el envío en segundo plano, la cola registra `sent`.
- **Pendiente:** identificar proveedor final (Brevo/webhook), garantizar idempotencia desde origen a proveedor, reintentos simultáneos y confirmar `delivered/bounced`. `sent` significa respuesta HTTP exitosa, NO entrega en bandeja.

### Identidad y recuperación de cuentas
- `GET /api/account/identity` autentica y expone `account_id` y `recovery_version`.
- Nueva `POST /api/account/recovery/atomic` con `request_id`, `new_secret` y `expected_version`, y tabla D1 `audience_recovery_state`.
- Ensayos sintéticos del Worker/SQLite comprobaron éxito, idempotencia, versión obsoleta y revocación de respaldos anteriores.
- **Coexistencia corregida en esta rama:** `POST /api/account/recovery` (heredado) comparte ahora el contador `audience_recovery_state` y el control de versión CAS con `POST /api/account/recovery/atomic`. Una prueba nueva de interoperabilidad sobre SQLite sintético alterna ambos circuitos, comprueba revocación de claves previas y rechaza versiones obsoletas; el workflow específico de Admin 2.0 pasó para el commit `219092f`. La prueba independiente `scripts/test-account-recovery-rollback.mjs` ahora fuerza errores SQL dentro del lote transaccional de ambas rutas y comprueba que la clave y versión originales sobreviven; la suite específica Admin 2.0 aprobó este caso en CI (commit `bfdf5ca`). La prueba `scripts/test-account-recovery-concurrency.mjs` aprobó en el CI del commit `f463f32`, lanzando solicitudes concurrentes en tres combinaciones (atómica/atómica, heredada/atómica y heredada/heredada) contra el Worker y SQLite D1 sintético: una sola solicitud triunfa, hay una sola clave activa y el dispositivo sigue funcionando. Se mantienen pendientes las carreras sobre D1 real de staging, la revisión del esquema y la comprobación de Worker efectivamente desplegado.
- No asumir que la nueva tabla creada bajo `uadavAccountSchema` es compatible con todas las rutas y bindings en staging hasta validarlo con el esquema real.

## Plan de validación en Work / staging aislado
1. **Entorno y respaldo.** Comprobar URL exacta de staging, commit/build y qué Worker responde; verificar binding a D1/KV de prueba y respaldo recuperable. No utilizar cuenta, clave o datos de producción.
2. **Admin PC y móvil.** Entrar como administrador QA; recorrer los 7 grupos y los 35 destinos, búsqueda `cuentas`, `artistas`, `correo`, `moderación`. Confirmar que opciones avanzadas siguen disponibles sólo a roles permitidos.
3. **Cuenta nueva.** Crear cuenta sintética desde la interfaz con Turnstile de prueba y verificar persistencia, cierre de sesión, reconexión y dispositivo adicional.
4. **Perfil artístico.** Crear nuevo perfil desde cuenta, comprobar publicación inmediata, enlace de titularidad, edición, duplicados, revocación y ausencia de revisión previa. Confirmar que los reclamos de perfiles preexistentes siguen protegidos.
5. **Recuperación.** Antes de probar una rotación, resolver coexistencia de endpoint legado/atómico. Probar con claves sintéticas: éxito, reintento, dos dispositivos, error/red interrumpida, reemplazo de clave, revocación e imposibilidad de reusar clave antigua.
6. **Correos.** Usar receptor/bandeja QA y webhook falso primero. Verificar registro de evento, ID único, una aceptación, reintentos sin duplicado, rebote y estado entregado con evidencia del proveedor. Comprobar plantillas y que no se expongan tokens en logs.
7. **Regresión visual.** Capturas y recorridos en PC y viewport móvil, volver desde fullscreen, filtros y publicación; comparar con producción únicamente en modo lectura, sin pruebas destructivas.
8. **Salida.** Adjuntar resultados y capturas, reporte del diferencial Worker vs baseline, migración/rollback documentados; recién entonces solicitar autorización separada para desplegar.

## Regla de aprobación
**No fusionar PR #68, no sobrescribir el Worker congelado ni tocar D1/KV productivos** mientras permanezca algún bloqueo técnico o falte QA de staging. El enlace a GitHub no certifica deployment.


## Descubrimiento de staging y plan de despliegue QA seguro (21/11/2026)

**Hecho comprobado en el repositorio, no en Cloudflare:**
- `uadav-api-config.js` fuerza el frontend staging a `https://uadav-api-staging.uadavstream.workers.dev/api/`; frontend público a `https://uadav-api.uadavstream.workers.dev/api/`.
- `wrangler.staging.toml.example` fija `name = "uadav-api-staging"` y `main = "worker-demo-staging.js"`.
- `worker-demo-staging.js` reexporta `releases/worker-staging-catalogo-20261119.js`, **no** el `worker.js` que cambia Admin 2.0.
- El archivo de ejemplo de staging incluye marcadores `STAGING_KV_ID_REQUIRED`, `STAGING_D1_ID_REQUIRED` y `DEMO_D1_ID_REQUIRED`; no prueba qué recursos concretos están configurados actualmente en Cloudflare.
- El workflow `staging-integration-published-preview.yml` apunta a una vista de staging distinta. Ningún workflow de esta rama confirma que Cloudflare esté ejecutando el nuevo código de cuentas.

**Preparación aislada creada sin desplegar:** `wrangler.admin-v2-qa.toml.example` propone el nombre distinto `uadav-api-admin-v2-qa` y `main = "worker.js"`, con marcadores de **tres recursos QA nuevos**: `UADAV_DB` (KV), `DB` (D1), `DEMO_DB` (D1); no incorpora rutas, cron, colas ni servicios de correo/pago. `scripts/test-admin-staging-boundaries.mjs` detecta cambios que hagan que QA apunte al Worker congelado o a la API productiva.

### Secuencia obligatoria (requiere acceso humano a Cloudflare o Work)
1. Inspeccionar en Cloudflare la configuración **real** del Worker `uadav-api-staging`, la última versión publicada y sus bindings, sin ejecutar escrituras.
2. Comprobar que los recursos D1 y KV reales no se comparten con producción. **No reutilizar ni copiar IDs productivos ni nombres de secretos a la plantilla.**
3. Crear (solo tras autorización específica) un KV QA nuevo y bases D1 QA nuevas e independientes. Guardar IDs únicamente en una configuración privada fuera del repo; nunca commitear esa configuración.
4. Preparar secretos QA exclusivos y Turnstile QA; usar destinos `.invalid` o casillas de prueba controladas. No habilitar emails reales ni webhooks de pago.
5. Preparar el frontend de QA con URL del nuevo Worker; **el frontend staging existente sigue forzando `uadav-api-staging`**, por lo que navegar allí **NO valida** el Worker QA nuevo.
6. Tras backups de los recursos QA y plan de reversión, desplegar **solo** el servicio `uadav-api-admin-v2-qa` con archivo privado derivado de la plantilla y ref/commit revisado.
7. Comparar `/api/health` del servicio QA, versión de Worker, visibilidad de D1/KV, y efectuar las pruebas de altas, recuperación, revocación, concurrencia, errores de DB y correo simulado, siempre sin usuarios productivos.
8. Si falla: revertir a la versión anterior del Worker QA o deshabilitar el servicio QA; no tocar `uadav-api-staging` ni `uadav-api`.
9. Solo tras revisión de resultados, respaldos de staging y autorización expresa se evalúa un despliegue separado al staging protegido. **Producción requiere otra autorización.**

**La plantilla no es una orden de despliegue. No desplegar todavía.** La API de salud no se pudo certificar desde esta sesión y la identificación de los bindings remotos sigue pendiente.


## Frontend QA aislado, sin cambios en frontend público (22/11/2026)

El frontend staging original contiene referencias directas a API, además de `uadav-api-config.js`; por eso cambiar una única variable no aísla realmente las pantallas.

Se agregó `scripts/build-admin-v2-qa-frontend.mjs` para **generar una copia estática** de la web en `dist-admin-v2-qa/` con reemplazo de las URL conocidas de ambos Workers (producción y staging) por `https://uadav-api-admin-v2-qa.uadavstream.workers.dev`. El JS de configuración del paquete generado exige host `uadav-admin-v2-qa.pages.dev` o subdominio de preview del mismo proyecto. El generador excluye `worker.js`, artefactos backend, `CNAME`, PWA service worker, carpeta de repositorio, workflows y scripts internos; no altera la web original. Un destino de salida fuera del directorio QA permitido se rechaza. Se automatizó `scripts/test-admin-v2-qa-frontend.mjs` en GitHub Actions.

**Comandos de preparación local, sin despliegue:**
```sh
node scripts/test-admin-v2-qa-frontend.mjs
node scripts/build-admin-v2-qa-frontend.mjs
```
El resultado `dist-admin-v2-qa/` es un artefacto local para publicar en un **nuevo proyecto** Cloudflare Pages con nombre `uadav-admin-v2-qa`, no en `uadav-stream-staging` ni en el dominio público. No se ha creado el proyecto Pages ni el Worker remoto. Antes de subirlo, deben verificarse todas las rutas externas de la web por si hay clientes adicionales con endpoints propios: el reemplazo de URL conocidas **no garantiza aislar integraciones que no usen esas URL**. No activar cuentas de usuario reales, correo, push, pagos ni funciones de administración en este frontend hasta verificar recursos y permisos desde Work.

El control de preservación del Worker congelado seguirá en rojo porque el PR cambia `worker.js`; eso **no se debe** solucionar manipulando el hash del control. Se requiere validación y aprobación específica por separado.


## Auditoría de conexiones del frontend QA (22/11/2026)

Se inspeccionaron los scripts de acceso por correo, avisos personales, perfiles, sincronización de cuentas, panel Admin y notificaciones push. Estos archivos incluyen referencias explícitas a Workers API y, en algunos casos, URLs absolutas de páginas staging. También hay integraciones de medios externos (videos/miniaturas), diferentes de las rutas de API.

**Corrección del generador, sin editar HTML/JS públicos:**
- Sustituye en el artefacto QA las URL absolutas conocidas de los dos Workers y de los sitios UADAV de staging/producción por los destinos QA.
- Genera `_headers` para Cloudflare Pages con `Content-Security-Policy` restringiendo `connect-src` a la propia web QA, al Worker `uadav-api-admin-v2-qa.uadavstream.workers.dev` y a Cloudflare Turnstile; `form-action 'self'`, `object-src 'none'`, `base-uri 'self'`, `Referrer-Policy: no-referrer`.
- Genera `robots.txt` y `X-Robots-Tag` para evitar indexación; no son un control de acceso. La web QA DEBE permanecer protegida por autenticación de Cloudflare Access o equivalente antes de usar datos de prueba sensibles.
- Se reforzó `scripts/test-admin-v2-qa-frontend.mjs` para comprobar que no queden referencias literales a Worker/API o páginas UADAV reales y que las cabeceras estén en el paquete.

**Evidencia:** workflow específico `Admin 2.0 regression checks` aprobado en commit `ca00bff` (código QA). Se conserva el fallo deliberado de `Staging integration preservation`; no desplegar automáticamente.

**Limitaciones explícitas:** esta protección estática de `connect-src` no sustituye auditoría de rutas compuestas dinámicamente, redirecciones, frames de terceros, extensiones ni integraciones de backend. El archivo `_headers` se debe verificar sobre el dominio Pages efectivamente publicado (puede no aplicar a respuestas de Functions). El frontend QA generado no contiene `service-worker.js`, pero cualquier sesión real debe usar perfil de navegador limpio. Antes de pruebas reales, confirmar Cloudflare Access, CSP, CORS del Worker QA, Turnstile QA, D1/KV nuevos y deshabilitación de emails y pagos.


## Restricciones adicionales de Web Push en QA (22/11/2026)

Se encontró `uadav-push-ui-v150.js`, que podía solicitar permiso de notificaciones, registrar `/uadav-push-sw.js` y solicitar una suscripción. Incluso con una API QA aislada, estas acciones no son necesarias para validar Admin 2.0.

El generador del frontend QA **sustituye ese módulo únicamente en el paquete** por un script inerte y excluye `uadav-push-sw.js` y `service-worker.js`. `scripts/test-admin-v2-qa-frontend.mjs` verifica que el paquete generado no tenga estos service workers ni la solicitud de permiso. El código original de producción y staging permanece intacto. Web Push real deberá probarse luego como submódulo separado, con dispositivo, suscripción y backend exclusivamente QA.

El estado de despliegue sigue igual: no existen en este repositorio evidencias de Cloudflare Access efectivo, ni confirmación remota de Pages QA, Worker QA o KV/D1 nuevos. **No publicar ni usar credenciales reales.**


## Corrección de origen y CORS del Worker QA (22/11/2026)

La plantilla `wrangler.admin-v2-qa.toml.example` contenía un defecto: `ACCOUNT_ALLOWED_ORIGINS`, `PUBLIC_SITE_URL` y `TURNSTILE_ALLOWED_HOSTNAMES` seguían configurados con el dominio del staging protegido, aunque el frontend QA generado utiliza `uadav-admin-v2-qa.pages.dev`. Esos tres valores ahora apuntan exclusivamente al dominio QA.

Se ampliaron dos verificaciones en GitHub:
- `scripts/test-admin-staging-boundaries.mjs` exige que las tres variables coincidan con la identidad de Pages QA y prohíbe referencias a los dominios de producción/staging en la configuración QA.
- `scripts/test-admin-v2-qa-origin.mjs` ejecuta el Worker de esta rama y verifica que autorice el Origin de Pages QA, rechace los Orígenes de staging/producción y niegue un hostname con sufijo falsificado. El test usa un entorno sin D1 precisamente para comprobar el filtrado de origen **sin acceder a datos**.

**Resultado comprobado:** suite específica Admin 2.0 aprobada en commit `571eb1e`, incluida la prueba de CORS.

**Aún no se comprobó Cloudflare:** CORS, Turnstile, Access y D1/KV se deben verificar luego en un Worker QA efectivamente desplegado y configurado con credenciales y recursos QA independientes. **La plantilla de ejemplo no contiene IDs ni secrets reales y no está lista para desplegar.**


## Gate independiente y cerrado por defecto para habilitar QA (22/11/2026)

Se agregó `scripts/admin-v2-qa-preflight.mjs`, un verificador **local, de solo lectura**, sin acceso a Cloudflare ni credenciales. Verifica una configuración Wrangler privada y un archivo privado de metadatos de aprobación:

- `name=uadav-api-admin-v2-qa`, `main=worker.js`, origen permitido, URL pública y hostname de Turnstile exclusivamente QA
- Los tres IDs `UADAV_DB`, `DB` y `DEMO_DB` tienen formato de ID de recurso y son distintos. No certifica por sí solo que sean recursos no productivos
- Rechazo de rutas, cron, colas, servicios de correo/pagos y referencias explícitas a dominios reales
- Evidencia independiente declarada por responsable: SHA exacto, recursos nuevos separados, acceso restringido a Pages y Worker, Turnstile y credenciales QA, email/pagos desactivados, plan de reversión y autorización de despliegue QA

**Uso eventual, sin ejecutar despliegue:**
```sh
node scripts/admin-v2-qa-preflight.mjs /ruta/privada/wrangler-admin-qa.toml /ruta/privada/evidencia-qa.json
```
Los archivos con IDs internos y evidencia real **no deben añadirse al repositorio**. No compartir secretos con la herramienta; el preflight imprime únicamente nombres de verificaciones faltantes.

El test sintético `scripts/test-admin-v2-qa-preflight.mjs` probó que el gate apruebe únicamente una configuración y evidencia completas de ejemplo y que **rechace por defecto** placeholders, IDs repetidos, rutas productivas, cron, falta de Access, de independencia de D1 o de aprobación. El workflow Admin 2.0 fue **SUCCESS** en commit `6b6ffb4`.

**Importante:** ningún conjunto de flags sustituye verificar los recursos en el panel de Cloudflare. El PR continúa sin estar autorizado para staging ni producción.


## Endurecimiento del preflight de Wrangler (22/11/2026)

El control `scripts/admin-v2-qa-preflight.mjs` ahora rechaza, además de los casos anteriores:
- Claves duplicadas y secciones Wrangler duplicadas, incluidas raíces / `[vars]`
- Cualquier sección o atributo no incluido en una lista mínima estricta de QA, no solo nombres peligrosos conocidos
- Más o menos bindings que `UADAV_DB`, `DB` y `DEMO_DB`
- Nombres D1 distintos de `uadav-admin-v2-qa-db` y `uadav-admin-v2-qa-demo`, rutas de migración DEMO_DB diferentes o fecha de compatibilidad inesperada

El nuevo conjunto de casos de rechazo en `scripts/test-admin-v2-qa-preflight.mjs` se aprobó en el workflow específico Admin 2.0 del commit `e910257`. Además se endureció el parser para **rechazar líneas de configuración que no interpreta**, incluidas claves TOML entrecomilladas o directivas malformadas, y esos nuevos casos aprobaron en el commit `ed878a0`. Esto verifica **el parser de configuración y evidencia sintética**; no certifica el aislamiento remoto ni autoriza el despliegue.


## Paquete QA con exclusión de material no operativo (22/11/2026)

El generador `scripts/build-admin-v2-qa-frontend.mjs` dejó de copiar archivos de auditoría, sumas de verificación, registros de validación antiguos y pantallas de ensayo de staging/ejemplos editoriales. Se restringieron específicamente los archivos JSON de raíz a metadatos de runtime conocidos (`manifest.json`, `version.json`, versión de acceso por email, identidad de instancia y modelo comercial). Las páginas públicas y los recursos JS/CSS de ejecución siguen disponibles.

El test `scripts/test-admin-v2-qa-frontend.mjs` exige simultáneamente la **ausencia de esas fixtures** y la **presencia del shell, Admin, Mi Perfil, manifest y API config**. La suite de Admin 2.0 aprobó para commit `4a3c32c`. Esta validación es estática: debe complementarse con navegación real de QA, sin mezclar Workers ni datos. No implica que los proyectos QA de Cloudflare ya existan ni autoriza desplegar.
