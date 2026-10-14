# Evidencia remota de staging — 14 de octubre de 2026

API: https://uadav-api-staging.uadavstream.workers.dev/api/
Worker cargado por el usuario: fuente auditada del commit e106318f9c662006aeda9db7d4da239b259fb453, V11.7 / build 11753. No equivale al mismo codigo de produccion aunque comparta numero de build.

Recursos verificados por capturas del usuario: Worker uadav-api-staging, D1 uadav-staging-db conectado como DB y KV uadav-staging-kv conectado como UADAV_DB. ADMIN_KEY exclusivo configurado por el usuario; no recibido ni utilizado en estas pruebas.

## Ejecutado desde el entorno de pruebas, contra Cloudflare real

1. tests/staging-readonly-smoke.mjs: PASA. Health responde, bindings presentes, inscripciones radio/TV cerradas y endpoints privados probados responden 401 sin credenciales. Sin escrituras en ese smoke.
2. tests/staging-account-integration.mjs: PASA. Inicializacion real de tablas D1, creacion de cuenta ficticia, lectura, actualizacion de favoritos, revision 1 -> 2, intento antiguo rechazado con 409 REVISION_CONFLICT y lectura final conserva revision 2. Cuenta anonima devuelve 401.

La cuenta se identifica como PRUEBA STAGING · SIN DATOS PERSONALES. Queda un registro sintetico en D1; no se borraron datos ni se registraron credenciales. No se usaron datos, secretos ni cuentas de produccion.

## No comprobado todavia

- Escritura/lectura real de KV: health solo confirma binding. Pendiente marcador inofensivo de pruebas.
- Inscripcion, revision, publicacion y recuperacion de radio/TV mediante credencial Admin de staging.
- Concurrencia y consistencia D1/KV reales bajo demora y fallos.
- Reproduccion, frontend de staging y dispositivos.
- Turnstile, IA, correo, queue y YouTube oficial: sin configurar en staging; no es prueba de falla.

## Configuracion antes de probar desde navegador

ACCOUNT_ALLOWED_ORIGINS y PUBLIC_SITE_URL deben apuntar al entorno de pruebas. El Worker usa valores de produccion como fallback si no se configuran; no conectar un frontend de pruebas hasta revisar sus URLs hardcoded. No agregar dominios/rutas productivas, cron, pagos, correo ni secretos productivos. La identidad PLATFORM refleja almacenamiento nuevo, no perdida de la configuracion real.

Nada fusionado ni desplegado en produccion. Los resultados remotos acotados no certifican el conjunto de la plataforma.

## Verificaciones adicionales

- ACCOUNT_ALLOWED_ORIGINS y PUBLIC_SITE_URL configurados por el usuario al hostname de staging (captura verificada).
- API /account con Origin https://uadavstream.com.ar: 403 ORIGIN_NOT_ALLOWED, sin Access-Control-Allow-Origin. Con Origin de staging: 401 por falta de credencial y CORS para el origen correcto. Esto comprueba el control de origen de cuentas, no el de toda la API general.
- Usuario guardo secciones_version=1 en KV de staging. GET remoto /api/secciones_version: HTTP200, JSON numerico 1. Lectura real de KV comprobada; escritura desde API aun pendiente.
- Preparado tests/staging-diagnostic.html: destino fijo staging, clave en memoria durante la ejecucion y borrada del campo al terminar, sin dependencias externas ni almacenamiento local. Prueba Admin, consulta D1 y escritura/lectura del marcador staging_kv_probe. Sintaxis revisada; ejecucion interactiva con Admin pendiente. Descargar y abrir localmente; nunca introducir clave de produccion.
