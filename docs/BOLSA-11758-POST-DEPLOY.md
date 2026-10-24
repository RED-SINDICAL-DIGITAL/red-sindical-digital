# Verificación posterior al despliegue manual · 24/10/2026

## Observado en el navegador de Work

- `https://uadav-api-staging.uadavstream.workers.dev/api/health`: `ok:true`, versión V11.7, **build 11758**, KV y D1 disponibles, `email_automation:false`, `queue:false`.
- `https://uadav-api-staging.uadavstream.workers.dev/api/bolsa_trabajo`: cinco ofertas y cinco IDs únicos.
- En esa respuesta pública no aparecen `owner_access_hash`, `consulta_hash`, `clave_contratante`, `clave_consulta`, `contacto`, `contacto_email`, `email`, `whatsapp` ni `request_id`.
- Pages carga Bolsa. Admin presenta la pantalla de acceso administrativo; no hay una sesión autenticada del asistente para verificar respaldos o datos privados.

Estos resultados no comprueban la separación física de KV/D1 frente a producción, las variables de autoridad de Bolsa ni la instalación del esquema nuevo. No se ejecutó migración desde el asistente.

## Preparación adicional

`migrations/staging/20261024_bolsa_completa.sql` contiene ambos esquemas de credenciales y almacenamiento por registro. Su consulta final muestra solo nombres de siete tablas, sin datos privados. El instalador se probó dos veces sobre SQLite con una credencial existente de revisión 3: conservó hash y revisión.

El panel de preparación de la rama Pages usa las rutas del Worker 11758 ya desplegado. Genera un backup validado, comprueba la simulación y las tablas incluidas en el respaldo y permite copiar con cursor y huella del servidor. Necesita la sesión de Admin de pruebas y la comprobación humana del binding DB y del mantenimiento. No habilita D1, correo ni restauración.

**Siguiente intervención necesaria:** guardar el backup desde Admin, demostrar aislamiento de la base vinculada a `uadav-api-staging`, ejecutar el SQL unificado en esa base y repetir el análisis. Revisar ese resultado antes de activar mantenimiento o copiar datos.

Producción y `main` no se modificaron. Los cambios de esta actualización de la rama Worker son instalador, documentación y pruebas; `worker.js` sigue siendo el mismo 11758.
