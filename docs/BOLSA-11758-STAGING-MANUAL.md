# Preparación manual del Worker 11758 · solo staging

Esta guía prepara el cambio; **no declara aprobado el corte a D1**. La recuperación por correo permanece deshabilitada en todo momento.

**Actualización comprobada:** el Worker staging ya devuelve 11758 después del despliegue manual. Para los pasos siguientes se agregó el panel **Admin → Historial de cambios → Preparar Bolsa en D1**, documentado en `docs/BOLSA-11758-PASOS-ADMIN.md` de la rama Pages. El SQL unificado `migrations/staging/20261024_bolsa_completa.sql` reúne ambos esquemas indicados abajo y muestra siete tablas al terminar. No requiere volver a desplegar el Worker.

## Primera intervención: desplegar código sin activar D1

1. En la cuenta de UADAV, abrir Workers & Pages → **uadav-api-staging**. Verificar el nombre, no usar `uadav-api`.
2. Edit Code → reemplazar el archivo principal completo por `worker.js` de la rama `release/radio-studio-staging-rc-20261020`. Deploy.
3. No cambiar bindings, secretos, rutas, dominios, cron ni flags. `JOB_STORE_D1` y `JOB_STORE_MAINTENANCE` deben estar ausentes o en `false`.
4. Abrir `https://uadav-api-staging.uadavstream.workers.dev/api/health`: debe indicar **11758**, KV/D1 activos y correo/cola sin activar.
5. Probar desde Pages staging la consulta de las ofertas existentes y el acceso privado con un comprobante de QA. No utilizar una clave de producción.

Esta primera operación conserva el origen KV y permite validar compatibilidad. Si falla, restaurar el archivo anterior del Worker staging. No tocar producción.

## Preparar la migración, únicamente con acceso verificado a Cloudflare

1. Descargar y conservar un backup administrativo actual. No pegarlo en chats, logs ni repositorios: contiene información privada y hashes.
2. Registrar el nombre/ID de la base vinculada como `DB` al Worker staging y contrastarlo con la base productiva. Si no se puede demostrar que son diferentes, detenerse.
3. En **la base staging**, ejecutar primero `migrations/staging/20261023_job_owner_credentials.sql` y después `migrations/staging/20261024_job_store.sql`.
4. Probar migración y restauración sobre una base desechable. Las pruebas locales no sustituyen esta comprobación remota.
5. Establecer temporalmente `JOB_STORE_MAINTENANCE=true` en **uadav-api-staging**. Pausa todas las escrituras HTTP de ese Worker salvo la ruta de migración. Las lecturas continúan.
6. Esperar a que concluyan las solicitudes que ya estaban en curso antes del mantenimiento. Volver a descargar/comparar el backup. El mantenimiento no puede cancelar una petición ya aceptada.

## Solicitudes administrativas de migración

Usar un cliente HTTP privado o la consola de pruebas autenticada. Encabezado `Authorization: Bearer <clave exclusiva de staging>` y `Content-Type: application/json`. Nunca escribir la clave en archivos versionados ni URLs.

Simulación sin escritura:

`GET https://uadav-api-staging.uadavstream.workers.dev/api/admin/jobs/migration`

Conservar los totales y `fingerprint`. Para el primer lote:

```json
{"dry_run":false,"confirm":"MIGRAR_BOLSA_STAGING","fingerprint":"COPIAR_LA_HUELLA_REAL","offset":0}
```

Enviar por POST a la misma ruta. Repetir usando exactamente `next_offset` devuelto, hasta `complete:true` y `next_offset:null`. No calcular el siguiente lote ni sustituir la huella. Si hay error o divergencia, detenerse y dejar D1 desactivado. El proceso no sobrescribe registros diferentes.

**No activar D1 automáticamente después de migrar.** Primero revisar la comparación, el backup y las pruebas remotas. El corte requiere `JOB_STORE_D1=true`, quitar el mantenimiento y probar publicación, consentimiento, dos envíos simultáneos, cierre, renovación, privacidad y acceso legado. La tabla `job_store_meta` debe tener `migration_ready=true`; el Worker falla de forma cerrada si falta.

Después del corte, **no volver a KV como si fuera una copia actual**: el KV antiguo deja de recibir ofertas y postulaciones. Una reversión exige detener escrituras y reconciliar/exportar el estado D1. Tampoco habilitar aisladamente `JOB_OWNER_D1_READS` sobre el circuito KV.

La restauración D1 solo admite faltantes y exige el flag independiente `ENABLE_JOB_D1_RESTORE=staging-tested`, un respaldo externo y confirmaciones en la API. Dejarlo ausente durante esta preparación. No restaurar las tablas de recuperación ni credenciales por SQL directo.

Sin acceso al panel no pueden verificarse IDs, instalar SQL, cambiar flags ni completar esta validación. No se requiere compartir contraseñas o códigos por chat.
