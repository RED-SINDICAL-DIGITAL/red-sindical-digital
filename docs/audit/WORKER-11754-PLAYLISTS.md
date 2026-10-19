# Worker de staging 11754 — playlists públicas

Archivo completo para reemplazar el código del Worker uadav-api-staging. Preparado desde la rama audit/public-job-status-20261012.

## Aplicación manual

1. Abrir uadav-api-staging en Cloudflare Workers.
2. Reemplazar el código por worker-staging-11754.js y desplegar.
3. Conservar las variables, secretos y bindings existentes. Esta entrega no exige migración de D1, cambios de credenciales ni activar cron.
4. Consultar /api/health del Worker de staging: debe informar build 11754.
5. Recargar el perfil de artista en la demo, abrir Playlists y comprobar nombres, carátulas y cantidades.

No aplicar al Worker de producción.

## Qué cambia

- Biblioteca del canal usa cache v2 para evitar datos antiguos incompletos.
- Si faltan metadatos, intenta recuperarlos con una consulta oficial por hasta 50 IDs.
- Los resultados sólo actualizan playlists presentes en la página solicitada.
- Una cantidad desconocida se devuelve como null; no se inventa cero.
- La respuesta indica metadata_incomplete si siguen faltando datos. Se conserva por 60 segundos para permitir una recuperación posterior; la completa, por 600 segundos.
- El frontend distingue datos incompletos de playlist vacía y usa un nombre de respaldo cuando falta el título.

## Validación y límites

- 197 pruebas CJS locales pasan; integraciones aisladas de módulos, RSS y titularidad pasan.
- La prueba real actual detectó 12 playlists con título vacío y cantidad cero. La recuperación real está pendiente del despliegue de este Worker. No se garantiza que el proveedor entregue todos los metadatos.
- No soluciona todavía discografía verificada ni reproducción de YouTube en todos los dispositivos.
- SHA-256 del Worker entregado: 537862113749cd545a0775655472afb460473796273e060a0530444c1f37c9f1.
