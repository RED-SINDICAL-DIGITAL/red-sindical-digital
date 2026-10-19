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
- Despliegue confirmado el 2026-10-19: /api/health informa build 11754, KV y D1 activos.
- El canal Madonna - Topic (UCo4CrqhIV_tSOGdDWfVyCsg) sigue devolviendo 12 playlists sin título ni imagen, count:null y metadata_incomplete:true. La recuperación no completó esos metadatos.
- El canal Madonna (@madonna, UC81VD6eeuLLSfyY_D-N8sVw) devuelve 39 playlists con títulos, cantidades y URLs de miniaturas; metadata_incomplete:false. La demo muestra los 39 títulos y cantidades, pero las imágenes visibles son de respaldo. No se considera resuelta la carga real de carátulas.
- Mejora frontend fa83040557c953d3ba26d2bbc35f3430f6338486: el directorio acepta enlace/@usuario/ID de canal, el perfil y compartir conservan ese canal, y la hidratación no mezcla búsquedas por nombre si ya conoce el canal. Búsqueda simple por nombre sigue sin ofrecer todas las coincidencias posibles.
- 205 pruebas CJS locales y todos los checks del cambio frontend pasan. Prueba real: pegar https://www.youtube.com/@madonna en Artistas, abrir el resultado, Playlists y Compartir; identidad exacta y 39 listas confirmadas. No exige otro despliegue de Worker.
- No soluciona todavía discografía verificada ni reproducción de YouTube en todos los dispositivos.
- SHA-256 del Worker entregado: 537862113749cd545a0775655472afb460473796273e060a0530444c1f37c9f1.
