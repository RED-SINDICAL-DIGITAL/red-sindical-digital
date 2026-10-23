# Plan de migración segura de credenciales — Bolsa, staging

Estado: **no ejecutado**. Las credenciales actuales siguen en KV. La recuperación de correo continúa deshabilitada.

## Requisitos antes de habilitar D1
1. Respaldo verificado y prueba de restauración en base desechable.
2. Esquema `job_owner_credentials` instalado solo en D1 staging.
3. Backfill idempotente por lotes pequeños, con control de concurrencia, desde el estado KV autenticado; no exportar hashes a logs, archivos de auditoría ni respuestas.
4. Diagnóstico de totales, faltantes y divergencias entre fuentes. Si hay diferencias, detener la activación.
5. Actualización de nuevas publicaciones para crear simultáneamente la credencial D1. Evitar que ofertas nuevas dependan exclusivamente del backfill.
6. Pruebas de acceso legado y D1 con credenciales de QA.
7. Implementar token de recuperación en D1 y rotación atómica bajo control de revisión; los dos pasos deben confirmar resultado antes de responder éxito.
8. Pruebas concurrentes, fallas inyectadas, idempotencia y reintentos; limpieza de tokens caducados.
9. Activación gradual en staging solamente, con reversión documentada; no volver automáticamente a KV después de rotar una clave.
10. Recién con pruebas exitosas habilitar formulario y correo, y solicitar el despliegue manual.

## Riesgos actuales
- La lista completa de ofertas está almacenada en KV, por lo que escrituras concurrentes pueden pisarse.
- El token consumido en D1 y el cambio de clave en KV no son una transacción.
- La verificación D1 está apagada por defecto y **debe seguir así** mientras existan credenciales sin migrar.
- No es seguro migrar filas mediante una ruta pública ni activar un flag para omitir controles.

## Siguiente implementación
Diseñar un proceso administrativo de migración con autorización, lotes, auditoría y dry-run, sujeto a las pruebas indicadas. No ejecutar cambios en las bases de producción.
