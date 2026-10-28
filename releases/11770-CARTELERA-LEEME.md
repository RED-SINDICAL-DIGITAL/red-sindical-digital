# Worker 11770 · Cartelera · candidato para staging

Archivo único: `worker-UADAVSTREAM-V11.7-11770.js`. Es idéntico a `worker.js`; no necesita importar los módulos de scripts por separado. SHA-256 y estado de validación en `11770-cartelera-manifest.json`.

## Resultado comprobado

422 pruebas del Worker aprobadas en la revisión de correo UUID del 28/10/2026. Las 173 pruebas de interfaz corresponden a la revisión anterior; no hay cambios de interfaz en este lote. Código completo del lote: importaciones canónicas, mantenimiento D1, destacados pagos con vencimiento válido, comprobación por referencia, cola de avisos y ensayo de restauración descartable con rollback/reintento. El operador completó las tres fases en una D1 exclusiva del laboratorio y confirmó un aviso real aceptado por Brevo (HTTP 201). Evidencia: `docs/CARTELERA-QA-11770-RESULTADO-20261028.json`. La corrección UUID se verificó remotamente en el wrapper QA y ahora se incorpora al candidato operacional. El candidato revisado aún no está desplegado ni validado remotamente. El laboratorio existente y su artefacto validado se conservan sin regenerarlos con otro core.

## Cargar el archivo sin activar funciones nuevas

1. Conservar el respaldo privado actual y el despliegue anterior de staging.
2. En Cloudflare, abrir Workers & Pages → **uadav-api-staging**. Comprobar el nombre antes de editar. No abrir ni modificar el Worker productivo.
3. Sustituir su código por el archivo completo y desplegar en ese Worker de staging. Conservar sus bindings y secretos; no copiar valores de producción.
4. Dejar sin configurar `EVENT_ATOMIC_STAGING`, `CARTELERA_STAGING_CRON` y `CARTELERA_MAIL_STAGING` si todavía no están presentes. Este archivo no los activa.
5. Consultar `https://uadav-api-staging.uadavstream.workers.dev/api/health`: debe mostrar build **11770**, KV y D1 disponibles. La recepción de un archivo no prueba por sí misma que el despliegue haya terminado.
6. Consultar `/api/eventos/capabilities`: con el circuito todavía desactivado debe responder `atomic_publication:false`. El resto de la plataforma y el cron de Bolsa conservan su configuración.

## Activación posterior: no está realizada por este paquete

Primero se valida el circuito con D1 aislado y se compara el respaldo. Después, exclusivamente en staging, `EVENT_ATOMIC_STAGING=true` habilita las nuevas operaciones de Cartelera. Los endpoints administrativos siguen exigiendo la clave Admin existente; no colocar claves en URLs.

El cron propio de Cartelera es **`7,22,37,52 * * * *`**, separado del cron de Bolsa. Necesita `CARTELERA_STAGING_CRON=cartelera-only` y el circuito atómico activado. No sustituir ni cambiar el cron existente de Bolsa. El mantenimiento se puede comprobar desde el endpoint autenticado `/api/admin/cartelera/maintenance`: GET consulta y POST ejecuta. No publicar una clave en el chat para hacerlo.

Los avisos permanecen desactivados. `CARTELERA_MAIL_STAGING=qa-only` permite enviar únicamente al destinatario ya configurado en `BREVO_QA_RECIPIENT`, usando el secreto `BREVO_API_KEY` existente y el remitente de staging ya utilizado por el acceso por correo. No permite envíos a otros contactos. Una respuesta perdida queda incierta y no se reenvía automáticamente; la aceptación del proveedor no certifica llegada a la bandeja. Hace falta una comprobación real de recepción antes de anunciarlo como entrega verificada.

## Restauración

`scripts/cartelera-restore.mjs` acepta únicamente respaldos con checksum válido, selecciona eventos, referencias, historial y avisos de Cartelera y restaura en una base vacía y descartable. Conserva el registro de aceptación de correos y pausa envíos que estaban en curso. Rechaza una base ocupada por otro sistema. No hay un endpoint que restaure Cartelera operativamente sobre el servicio actual. Ensayo local: `node scripts/rehearse-cartelera-restore.mjs RUTA_DEL_RESPALDO_PRIVADO.json`.

## Alcance del cierre

El circuito aislado tiene confirmación del operador de D1 remoto, restauración con rollback y correo recibido. El candidato operacional revisado está probado localmente; falta desplegarlo en `uadav-api-staging` y verificar su salud. No certifica restauración operativa de toda la plataforma ni entrega general a usuarios. No modifica producción, no activa recuperación histórica de ofertas, no reactiva ArtistaPRO y no convierte un comprobante de pago en aprobación automática.

## Revisión de correo del 28/10/2026

La clave de idempotencia de Cartelera se deriva del identificador de aviso como UUID estable, usando el mismo algoritmo del laboratorio que obtuvo HTTP 201. Al aceptar un aviso se limpian error_code, next_at y lease_until. Se conserva el máximo de tres intentos y no se reenvía una aceptación persistida. SHA-256 del candidato revisado: `3d8aab739bc8a06f940530719cb7981674a8d577e92fc6729b3240e9562b08cb`. El build sigue siendo 11770; comprobar el archivo por hash, no solo por número de build. Esta revisión no cambia flags ni habilita el correo para otros usuarios.
