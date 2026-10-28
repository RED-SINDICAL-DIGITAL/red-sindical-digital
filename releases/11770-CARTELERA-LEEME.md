# Worker 11770 · Cartelera · candidato para staging

Archivo único: `worker-UADAVSTREAM-V11.7-11770.js`. Es idéntico a `worker.js`; no necesita importar los módulos de scripts por separado. SHA-256 y estado de validación en `11770-cartelera-manifest.json`.

## Resultado comprobado

426 pruebas del Worker aprobadas en la revisión de correo UUID del 28/10/2026. Las 173 pruebas de interfaz corresponden a la revisión anterior; no hay cambios de interfaz en este lote. Código completo del lote: importaciones canónicas, mantenimiento D1, destacados pagos con vencimiento válido, comprobación por referencia, cola de avisos y ensayo de restauración descartable con rollback/reintento. El operador completó las tres fases en una D1 exclusiva del laboratorio y confirmó un aviso real aceptado por Brevo (HTTP 201). Evidencia: `docs/CARTELERA-QA-11770-RESULTADO-20261028.json`. La corrección UUID se verificó remotamente en el wrapper QA y ahora se incorpora al candidato operacional. El candidato revisado aún no está desplegado ni validado remotamente. El laboratorio existente y su artefacto validado se conservan sin regenerarlos con otro core.

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

La clave de idempotencia de Cartelera se deriva del identificador de aviso como UUID estable, usando el mismo algoritmo del laboratorio que obtuvo HTTP 201. Al aceptar un aviso se limpian error_code, next_at y lease_until. Se conserva el máximo de tres intentos y no se reenvía una aceptación persistida. SHA-256 del candidato revisado: `d7737957ee3d01ceee68fdd0128802c206245a4ba127958fde59103eae0f8d00`. El build sigue siendo 11770; comprobar el archivo por hash, no solo por número de build. Esta revisión no cambia flags ni habilita el correo para otros usuarios.

## Una pasada de comprobación operacional

Revisión identificable: `11770-cartelera-cierre-20261028`. Este archivo conserva el build 11770; `/api/health` muestra `cartelera_revision` y `/api/eventos/capabilities` muestra `revision`. La revisión previa con UUID fue desplegada por el operador y salud/KV/D1 confirmadas en el chat; este candidato añade comprobación y todavía necesita desplegarse.

1. Desplegar solo `releases/worker-UADAVSTREAM-V11.7-11770.js` en **uadav-api-staging**. Conservar bindings/secretos/variables. No tocar producción ni el laboratorio.
2. Abrir `https://uadav-api-staging.uadavstream.workers.dev/qa/cartelera-staging`. Ingresar la clave Admin de staging en esa página, nunca en el chat.
3. Pulsar **Revisar estado**. El endpoint de comparación se ejecuta antes del router principal y no inicializa ni modifica tablas. Solo devuelve cantidades y bloqueos, sin títulos ni contactos.
4. Pulsar **Descargar respaldo privado** y confirmar en el equipo que existe el archivo. La página verifica checksum SHA-256 y snapshot D1 atómico antes de solicitar descarga. El respaldo es privado: no pegarlo en el chat.
5. Pulsar **Copiar resultado seguro** y compartir únicamente ese JSON. Si `ready:false`, no activar el circuito ni ejecutar una migración general. No elegir automáticamente entre copias diferentes. Las diferencias no se reparan sobrescribiendo D1.
6. Con comparación aprobada y respaldo conservado, en una ventana sin ediciones/publicaciones se puede pasar a la activación controlada exclusivamente en staging. La página no activa variables, no migra ni envía correos. La comparación no constituye un snapshot distribuido entre KV y D1.

`LEGACY_EVENTS_MISSING_IN_D1`: falta copiar un registro legado antes de activar. `CONFLICTING_LEGACY_COPIES` y `LEGACY_D1_DIFFERENCES_REQUIRE_REVIEW`: hay versiones diferentes, requieren revisión explícita. `D1_ONLY_PUBLIC_EVENTS_REQUIRE_REVIEW`: activar expondría eventos adicionales. `INVALID_*`: datos inválidos, no saltar el control. `LEGACY_CHANGED_DURING_CHECK`: repetir consulta al terminar las ediciones. Ninguna de estas comprobaciones altera la Bolsa.
