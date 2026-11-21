# Bolsa 11758 · preparación desde Admin staging

El Worker **11758** fue comprobado en `/api/health` después del despliegue manual. El catálogo público conserva cinco IDs únicos y no expone contactos privados, correos, claves, hashes o identificadores de solicitud. Esto no prueba la separación de bases de Cloudflare.

La herramienta nueva está en **Admin → Historial de cambios → Preparar Bolsa en D1 · Solo staging**. Usa la sesión del Admin existente; no agrega otra clave ni la envía a otro servicio.

## Preparar las tablas

1. Abrir Admin de `uadav-stream-staging.pages.dev` con la clave exclusiva de pruebas. Pulsar **Generar respaldo y revisar**. Guardar el JSON en un lugar privado: contiene datos administrativos y hashes.
2. En Cloudflare abrir **uadav-api-staging → Configuración / Bindings → DB** y comprobar que el nombre/ID de la base difiere del binding de producción. No suponer que una base es de pruebas por su nombre.
3. En esa base de pruebas, abrir la consola D1 y ejecutar **`migrations/staging/20261024_bolsa_completa.sql`** de la rama Worker. Reúne los dos esquemas previos; solo crea estructuras faltantes. No copia datos, no borra registros, no activa variables. Su consulta final debe listar siete tablas.
4. Volver a Admin y pulsar **Generar respaldo y revisar** otra vez. El panel debe reconocer las tablas de respaldo; conservar también esta copia.

No habilitar `JOB_STORE_D1`, `JOB_OWNER_D1_READS`, correo ni restauración durante estos pasos.

## Copiar después de comprobar aislamiento y respaldo

La copia no es el corte a D1 y conserva KV. Para ejecutarla, activar temporalmente `JOB_STORE_MAINTENANCE=true` en **uadav-api-staging**, dejando `JOB_STORE_D1` desactivado. Esto pausa todas las escrituras HTTP del Worker excepto migración. Esperar a que terminen solicitudes que ya estaban en curso, volver a generar el respaldo y confirmar en el panel que se guardó, se verificó el aislamiento de DB y está activo el mantenimiento.

Pulsar **Copiar Bolsa a D1**. La pantalla procesa un lote por vez, usa la huella y el cursor devueltos por el Worker y se detiene ante cambios o errores. **Pausar después del lote** deja finalizar la transacción en curso. Un reintento repite solamente el último lote no confirmado; el servidor evita sobrescrituras y duplicados.

El panel no activa D1, no quita mantenimiento ni habilita recuperación. Al terminar, copiar **Resultado sin datos privados** para revisar la comparación y seguir con validación de accesos y corte controlado. No compartir el backup, claves ni hashes en el chat.

## Validación y límites

- Se probaron en local la ausencia de escrituras durante el análisis, el bloqueo fuera de staging, la validación del respaldo, los lotes secuenciales, doble clic, pausa/continuación, respuestas incompletas, navegación a otra vista y el informe sin datos privados.
- El panel necesita autenticación de Admin. No se completó su circuito autenticado en el navegador del asistente.
- La presencia de tablas en un backup no sustituye la comprobación del binding ni las pruebas remotas de restauración.
- La instalación SQL y la migración fueron ejecutadas por el usuario en Cloudflare/Admin. El informe final confirmó 5 ofertas y 5 postulaciones, 10 registros y comparación completa. La captura posterior del Admin confirmó que Bolsa ya usaba D1.
- Después de que el usuario desactivara mantenimiento se probó en el navegador de PC de Work: publicación inmediata, consentimiento obligatorio en el formulario, una sola postulación ante doble clic, seguimiento privado, rechazo de clave incorrecta, respeto de campos opcionales excluidos, cierre, rechazo desde una pantalla desactualizada y renovación. La oferta ficticia se dejó cerrada al terminar. La prueba móvil, el acceso con un comprobante anterior a la migración y la restauración remota siguen pendientes.

## Respaldar después de activar D1

**Generar respaldo y revisar** también solicita descargar el backup actual cuando Bolsa ya usa D1. Comprueba que las ofertas y postulaciones exportadas coincidan con todos los registros de almacenamiento y sus credenciales actuales, además de verificar las tablas y la marca de migración. Si hay truncamiento o cambios entre las lecturas del export, detiene la descarga y pide repetir la operación. Si vuelve a fallar, pausar las escrituras de staging antes de revisar el respaldo.

El informe muestra el origen D1 y sus cantidades, sin nombres, correos, hashes ni claves. Se ocultan las confirmaciones y los botones para copiar KV, porque no corresponde repetir la migración. El mensaje de descarga solicitada no prueba que el usuario haya conservado el archivo: hay que guardarlo y comprobar que exista en el equipo.

Con D1 en uso, el KV anterior deja de recibir las escrituras de Bolsa. No desactivar `JOB_STORE_D1` para volver a esa copia: una reversión requiere mantenimiento y reconciliación/exportación del estado actual de D1. La recuperación por correo y la restauración no se habilitan desde este panel.

La corrección del respaldo se verificó con la suite de 68 pruebas de Pages, incluida la detección de datos inconsistentes, credenciales distintas, filas duplicadas, descarga fallida y navegación fuera del Admin. La descarga autenticada desde la sesión del usuario debe verificarse después del despliegue de Pages.
