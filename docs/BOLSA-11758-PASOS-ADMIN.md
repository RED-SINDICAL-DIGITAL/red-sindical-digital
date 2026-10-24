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
- La copia SQL preparada no se ejecutó desde el asistente. El almacenamiento D1 sigue pendiente de activación y QA remota.
