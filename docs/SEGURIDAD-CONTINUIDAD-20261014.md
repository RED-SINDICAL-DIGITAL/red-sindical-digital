# Continuidad de seguridad y acceso — 14/10/2026

Sin cambios en main ni produccion. Sin fusion ni despliegue.

## KV: privado por defecto

En audit/public-job-status-20261012 la lectura generica ya no depende de una lista de claves privadas conocidas. Cualquier clave desconocida requiere Admin. Solo se mantienen publicas en el fallback footer_config, landing_config, apariencia, estado_sitio y secciones_version. Los endpoints explicitos conservan sus propios controles y deben seguir auditandose; esta correccion no certifica todas sus respuestas.

La prueba ejecuta el Worker con datos ficticios: 23 claves privadas, incluidas dos desconocidas, quedan denegadas; tambien se prueban alias con barras, acceso Admin y configuracion publica compatible. Un 404 por modulo cerrado tambien se acepta como denegacion sin datos. Se mantienen las pruebas de revision atomica Worker + SQLite.

## Sesion del artista

En fix/artist-session-main-20261011 la renovacion usa el ID del artista abierto, en lugar de depender del artista seleccionado en almacenamiento por otra pestaña. El servidor sigue verificando propiedad y permisos; no se extiende una credencial revocada. Si cambia la cuenta durante la renovacion, se rechaza el reintento y no se guarda el token nuevo.

Pruebas con helpers reales extraidos de gestionar-artista.html: 10/10 pasan. Incluyen rutas API, renovacion tras 401, denegacion 403 sin renovar y cambio de cuenta durante la respuesta. Son pruebas aisladas con respuestas simuladas; faltan cuentas reales autorizadas/revocadas en staging y navegador.

## Resultados locales

- 25 contratos de inscripcion de señales y seguimiento de postulaciones: pasan.
- Worker real + SQLite, revision y conflictos: pasa.
- Worker real + KV ficticio, politica privada por defecto: pasa.
- Sintaxis Worker: pasa.
- 10 pruebas de sesion/rutas del artista: pasan.

La rama de sesiones no fue fusionada con la rama de auditoria ni con main. Preparar una comparacion posterior antes de integrarlas. Cloudflare staging sigue sin crear; no hay validacion D1/KV remota ni certificacion visual nueva.
