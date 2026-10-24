# Bolsa 11759 · Mis trabajos y avisos internos · solo staging

## Punto de partida confirmado

El usuario confirmó el informe `already-d1`: 6 ofertas, 6 postulaciones, origen D1 y respaldo consistente con descarga solicitada. Incluye la oferta ficticia cerrada y su única postulación. Conservar el JSON descargado en privado. La descarga solicitada no demuestra por sí sola que el archivo se haya guardado en el equipo.

La última versión del Worker observada en el navegador fue **11758**. El código **11759** de esta actualización requiere despliegue manual y una tabla adicional. Las pruebas locales/CI no equivalen a funciones ya desplegadas. No se cambió producción ni se mezclaron ramas.

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
- Pages: **82 pruebas**. Incluye cambios de cuenta durante respuestas privadas, opción de no guardar, comprobantes antiguos, compatibilidad de los formularios y respaldo consistente.
- Compatibilidad KV, política pública, sincronización de cuentas y 12 controles estáticos de Radio Studio aprobados.
- La prueba con 2.000 ofertas y 1.999 postulaciones comprueba el presupuesto de subsolicitudes D1 con cuenta y perfil artístico. Es una prueba local, no una prueba de carga remota. Referencia: https://developers.cloudflare.com/d1/platform/limits/. Un `batch()` cuenta como una subsolicitud a efectos del límite por invocación.

Antes de dar por validada esta versión, probar en Cloudflare con datos ficticios: cuenta A/publicador, cuenta B/postulante, segundo dispositivo aprobado, vinculación de un comprobante anterior, aislamiento, cierre/renovación y avisos leídos. Repetir en móvil y guardar un backup posterior. La restauración remota requiere una base desechable; mantener `ENABLE_JOB_D1_RESTORE` ausente hasta completar esa prueba. La entrega por correo y los avisos de vencimiento siguen pendientes; no se activan con este despliegue.
