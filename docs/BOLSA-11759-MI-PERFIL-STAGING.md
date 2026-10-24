# Bolsa 11759 · Mis trabajos y avisos internos · solo staging

## Punto de partida confirmado

El usuario confirmó el informe `already-d1`: 6 ofertas, 6 postulaciones, origen D1 y respaldo consistente con descarga solicitada. Incluye la oferta ficticia cerrada y su única postulación. Conservar el JSON descargado en privado. La descarga solicitada no demuestra por sí sola que el archivo se haya guardado en el equipo.

El usuario desplegó **11759** y el navegador de Work lo confirmó en el hostname exacto de staging, con D1 activo, correo y cola desactivados. Después del alta manual de una cuenta ficticia, el circuito autenticado confirmó la tabla adicional y guardó dos asociaciones. Las pruebas locales/CI y las pruebas remotas se distinguen abajo. No se cambió producción ni se mezclaron ramas.

## Cambios preparados

- Asociación explícita de ofertas y postulaciones a una cuenta validada. El identificador de cuenta procede de la sesión; el correo y los IDs enviados por el cliente no acreditan propiedad.
- Oferta, credencial y asociación se guardan en la misma transacción. El permiso del dispositivo o del respaldo se vuelve a comprobar dentro de ella; una revocación concurrente impide el guardado completo.
- Los comprobantes anteriores se pueden vincular después de comprobar su clave privada. Solo una cuenta puede asociarse a cada gestión; vincular otra exige quitar antes la asociación actual. El comprobante original sigue siendo válido.
- Lista privada paginada, acceso a postulantes y cierre/renovación desde la cuenta. Un dispositivo aprobado ve las mismas gestiones. No se sincronizan las claves de los comprobantes.
- Avisos internos por una nueva postulación y por un cambio de estado. Se escriben en la transacción de la operación, sin correos, nombres de postulantes ni claves en el aviso; usan el circuito existente de lectura/no leído.
- El respaldo incluye `job_account_links`. Pages verifica también sus referencias a registros y cuentas.
- La restauración, que sigue deshabilitada por defecto, admite la opción administrativa explícita `restore_account_links:true`. Solo repone vínculos junto con registros faltantes, conserva asociaciones existentes, omite cuentas eliminadas y no genera avisos por postulaciones históricas. Devuelve los vínculos restaurados y omitidos.
- El núcleo de recuperación revoca la asociación de la oferta al rotar la credencial, dentro de la misma transacción. **Los endpoints de recuperación por correo siguen devolviendo 503.**

## Instalación manual en Cloudflare

1. Abrir **D1 → uadav-staging-db → Console**. Es la base cuyo binding `DB` se verificó en **uadav-api-staging**. No usar `uadavstream`.
2. Ejecutar `migrations/staging/20261024_job_accounts.sql`. No contiene comentarios; admite pegarse en una sola línea. Crea una tabla y un índice, sin modificar ofertas, postulaciones, cuentas ni credenciales existentes. La consulta final debe devolver `job_account_links`.
3. En **Workers & Pages → uadav-api-staging → Edit Code**, reemplazar el archivo completo por `worker.js` de `release/radio-studio-staging-rc-20261020`. Deploy.
4. Conservar `JOB_STORE_D1=true` y `JOB_STORE_MAINTENANCE=false`. No repetir la migración KV, cambiar bindings, agregar cron ni activar restauración o correo.
5. Abrir `https://uadav-api-staging.uadavstream.workers.dev/api/health`: comprobar **11759**, KV/D1 activos y correo/cola desactivados. Recargar Pages staging antes de probar.

El instalador usa claves foráneas con `ON DELETE CASCADE` únicamente para las asociaciones. Eliminar una cuenta o un registro elimina sus vínculos, sin borrar por ese motivo ofertas ni postulaciones. D1 aplica claves foráneas por defecto: https://developers.cloudflare.com/d1/sql-api/foreign-keys/.

Si una sesión de cuenta recibe `ORIGIN_NOT_ALLOWED`, comprobar la variable **del Worker staging** `ACCOUNT_ALLOWED_ORIGINS`: debe autorizar `https://uadav-stream-staging.pages.dev`. No modificar la variable ni los dominios de producción. No compartir claves o códigos por chat.

## Pruebas y puerta de salida

- Suite SQLite: **26 pruebas** de almacenamiento, esquema y cuentas. Incluye carreras de doble vínculo, revocación antes del commit, rollback, privacidad, consentimiento, avisos y lectura, paginación, recuperación bloqueada y restauración de asociaciones.
- Pages: **84 pruebas**. Incluye cambios de cuenta durante respuestas privadas, opción de no guardar, comprobantes antiguos, compatibilidad de los formularios, anidación real de las acciones del modal, invalidación de bandejas durante el refresco y respaldo consistente. CI final aprobado: `40118351789`, commit `43f60b7f6e49e66a95ac659124bd85bd042f1dd8`.
- Compatibilidad KV, política pública, sincronización de cuentas y 12 controles estáticos de Radio Studio aprobados.
- La prueba con 2.000 ofertas y 1.999 postulaciones comprueba el presupuesto de subsolicitudes D1 con cuenta y perfil artístico. Es una prueba local, no una prueba de carga remota. Referencia: https://developers.cloudflare.com/d1/platform/limits/. Un `batch()` cuenta como una subsolicitud a efectos del límite por invocación.

Antes de dar por validada esta versión, completar la prueba con una cuenta B independiente, un segundo dispositivo aprobado y un comprobante anterior; extender en móvil los casos de cuenta y seguimiento. La cuenta A, cierre/renovación, cambios de estado, avisos y backup posterior ya se probaron en PC de Work. El usuario también completó publicación, postulación, bandeja del contratante y cierre desde su celular, corroborados abajo. La restauración remota requiere una base desechable; mantener `ENABLE_JOB_D1_RESTORE` ausente hasta completar esa prueba. La entrega por correo y los avisos de vencimiento siguen pendientes; no se activan con este despliegue.

## Comprobaciones remotas posteriores al despliegue

- `/api/health`: build 11759, D1 disponible, correo y cola desactivados.
- Catálogo público: 5 ofertas y 5 IDs únicos; sin claves, hashes, contactos, correo, WhatsApp ni identificadores de solicitud.
- `/api/bolsa_trabajo/cuenta` sin sesión: devuelve `JOB_ACCOUNT_AUTH` y «Acceso privado requerido», sin datos de gestiones.
- Mi Perfil carga la nueva sección y conserva las consultas por comprobante.

El usuario completó manualmente el alta de «Contratante QA 11759 · Ficticio». La sesión autenticada se comprobó por la interfaz y las respuestas de Mis trabajos; no se inspeccionaron credenciales. El inicio de sesión Admin se completó mediante la solicitud segura del navegador.

[Pantalla preparada sin credenciales](evidence/bolsa-11759-crear-cuenta-qa-20261024.jpg).

### Circuito de cuenta aprobado en PC de Work

1. Oferta ficticia `JOB-MVMOB8GL-8ACEE472031B`, «QA 11759 · Cuenta y avisos · 24-10», publicada inmediatamente y guardada en Mi Perfil.
2. Postulación ficticia `POST-MVMOCYNV-7002713F` guardada con consentimiento explícito; otra (`POST-MVMOGAJ1-2D46BD48`) enviada con la opción de guardar desmarcada. Solo aparecen dos gestiones en la cuenta: oferta y primera postulación.
3. La bandeja del contratante muestra ambas candidaturas. El mensaje, WhatsApp y portfolio de prueba que no se autorizó compartir permanecen ausentes; no se muestran claves privadas.
4. Los avisos internos por nuevas postulaciones llegan y su lectura persiste al recargar. Solo la candidatura ficticia vinculada se cambió desde Admin a «En revisión»; Mi Perfil recibió el nuevo estado y el aviso correspondiente. Ese aviso también quedó leído después de recargar.
5. Cierre, renovación por 30 días y cierre final desde Mi Perfil. La oferta queda cerrada, conserva sus postulantes y no aparece en el catálogo público. Las cinco ofertas públicas originales conservan sus IDs.
6. La prueba detectó dos defectos de Pages: inserción de la opción de cuenta en el contenedor equivocado del modal y conservación de una bandeja anterior al refrescar. Ambos se corrigieron, cuentan con pruebas y se verificaron publicados. El título de la bandeja ahora ocupa todo su ancho y la descripción explica cuenta y comprobante.

Pages publicado: `43f60b7f6e49e66a95ac659124bd85bd042f1dd8`; Worker publicado: build 11759, fuente `6e2fcc4270eb7453db0e522c19b80e6d9873e46c`. Estos cambios de documentación no requieren desplegar otro Worker.

[Cuenta y bandeja privadas con datos ficticios](evidence/bolsa-11759-cuenta-validada-20261024.jpg).

### Backup posterior verificado

La herramienta Admin generó y descargó un JSON actual de D1: **7 ofertas, 8 postulaciones y 2 asociaciones**. El archivo existe, tiene 233.187 bytes, `build:11759`, `job_storage:d1`, `job_accounts_available:true` y `backup_integrity.complete:true`; no hay errores de KV, tablas o inventario. Se comprobaron las referencias de asociaciones a registros y cuentas. Se guardó en privado para el usuario; no se incorpora a git.

El inventario informa ausentes `artist_ai_usage` y `artist_ownership_transfers`, ajenas al esquema de Bolsa. No se interpreta este backup de Bolsa consistente como una prueba integral de recuperación de toda la plataforma.

Una ejecución adicional de todos los `*.test.cjs` de Pages dio 509 aprobadas y 46 fallas. Se reprodujeron exactamente las mismas fallas en el commit base `0075f41`, sin los ajustes visuales posteriores. Incluyen fixtures de Radio, búsqueda, acceso/eliminación de artista y video; quedan registradas para la continuidad y no invalidan el resultado de las 84 pruebas específicas ni equivalen a integración global aprobada.

### Publicación, postulación y cierre desde móvil · 24/10/2026

El usuario confirmó haber publicado desde su celular una oferta ficticia y descargado el acceso privado. El catálogo público de staging corroboró una única oferta nueva: `JOB-MVMT57YC-897E34406860`, «PRUEBA MOVIL NO CONTRATAR», activa, sin logo y con vencimiento `2026-11-23`. Fue creada a las 16:44 de Argentina. El catálogo pasó de cinco a seis ofertas visibles.

Después el usuario confirmó el envío de una candidatura desde el celular y la descarga de su comprobante. Se volvió a autenticar Admin mediante el formulario seguro, sin inspeccionar la clave. En la lista privada se comprobó exactamente una fila asociada a esa oferta, con estado «Recibida automáticamente». Los totales administrativos son ahora **8 ofertas y 9 postulaciones**. No se modificaron estados desde Admin en esta comprobación.

El usuario confirmó además abrir en el celular el archivo privado del contratante, ver la candidatura, cerrar la oferta y comprobar su desaparición después de actualizar la búsqueda. Se corroboró de forma independiente que el catálogo vuelve a los cinco IDs originales y que Admin conserva la oferta como oculta/reactivable junto con su candidatura recibida. El respaldo confirma `activo:false`, `estado:cerrada_por_contratante` y la postulación `POST-MVMT9Y4B-F51EE764`, en estado `recibida`, con consentimiento `job_application_v1` y fecha registrados. No se publican datos de contacto ni claves.

El usuario confirmó también consultar desde Mi Perfil, en el celular, el archivo privado de la candidatura después del cierre: continúa mostrando «Recibida». La realización en el teléfono, la apertura de ambos archivos y las descargas son confirmaciones del usuario; las verificaciones independientes observan los registros del servidor, el catálogo público y Admin. Quedan los casos de cuenta/dispositivo y la prueba de envío desde una pantalla móvil desactualizada. No declarar aprobado todo el circuito móvil por estos resultados.

Se generó, descargó y comprobó un segundo respaldo posterior al cierre: **8 ofertas, 9 postulaciones y 2 asociaciones**, 17 registros D1, 240.345 bytes. La proyección compatible coincide registro por registro con D1, no hay IDs duplicados ni referencias rotas entre asociaciones, registros y cuentas; `backup_integrity.complete:true`, sin errores de lectura ni inventario. Se actualizó el archivo privado del usuario conservando su versión anterior. El respaldo de 7 ofertas y 8 postulaciones documentado arriba queda como evidencia histórica. El JSON sigue fuera de git.

[Oferta móvil cerrada y conservada en Admin staging](evidence/bolsa-11759-oferta-movil-cerrada-20261024.jpg).

Al recargar, Admin puede mostrar momentáneamente el acceso antes de restaurar automáticamente la sesión. Esperar la comprobación visible del estado final antes de solicitar credenciales otra vez. No leer claves ni extraerlas del almacenamiento del navegador.

El Worker continúa en 11759 y Pages en `43f60b7f6e49e66a95ac659124bd85bd042f1dd8`; este registro no cambia código ni requiere despliegue. Producción permanece intacta y la recuperación por correo continúa bloqueada.

Avance posterior: los avisos de vencimiento se prepararon en código 11760, con esquema adicional y pruebas locales. La instalación y el estado de despliegue se detallan por separado en `BOLSA-11760-AVISOS-STAGING.md`; no interpretar este avance como Worker 11760 ya publicado.
