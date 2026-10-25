# Bolsa 11761 · fechas y fuentes externas · solo staging

## Estado

**Actualización del 25 de octubre:** el usuario desplegó 11761 y health lo confirma, con D1/KV disponibles y correo/cola apagados. Pages está publicado en su rama separada. La prueba remota de captura por URL falló antes de incorporar datos; **no está aprobada**. Ver `BOLSA-ESTADO-Y-CIERRE-20261025.md` para evidencia y los seis bloques pendientes. Las instrucciones de despliegue de más abajo corresponden a la entrega original del 24 y ya fueron ejecutadas para 11761.

No cambia el esquema ni requiere SQL, variables, credenciales, bindings o cron nuevos. No se habilita recuperación por correo o restauración. No fusionar ramas ni aplicar en producción.

## Qué corrige

- Las fechas de publicación, edición e importación revisada se comparan con el día de Argentina. Después de medianoche UTC todavía puede ser el día anterior en Argentina. El plazo por defecto y renovar 30 días se calculan desde ese día local, sin sumar accidentalmente un día.
- Se rechazan fechas calendario imposibles. Una edición de historial puede conservar una fecha pasada sin reabrir la oferta. Reactivar exige un plazo vigente; el cierre del contratante sigue respetándose.
- La identidad externa usa la URL completa normalizada, sin el fragmento, preservando mayúsculas de ruta y consulta. Se ignoran IDs ajenos para actualizar; una importación no sobrescribe ofertas nativas ni otra fuente con el mismo identificador. Los IDs y credenciales anteriores se conservan al actualizar la misma URL.
- La URL de postulación también se valida. La modalidad externa dirige al origen, sin crear una candidatura interna. Se preservan cierres y ofertas administradas/reclamadas. Repetir una carga no reabre la oferta. Se conservan los indicadores de sincronización de la fuente.
- Un lote con datos inválidos se rechaza completo. D1 conserva sus guardas de revisión, transacción e índice único, incluso ante un cierre concurrente. No se trunca una colección para hacer lugar; capacidad agotada o URLs ya duplicadas requieren revisión administrativa.
- La ruta genérica antigua `admin/import` deja de admitir Bolsa cuando D1 es la autoridad; devuelve una instrucción de actualizar Admin. La planilla nueva ya usa la ruta externa revisada.

## Lectura de fuentes

La extracción exige Admin antes de cualquier consulta externa y limita tamaño/tipo de solicitud. Solo admite dominios públicos HTTPS, sin credenciales, IPs literales ni puertos especiales. Comprueba A y AAAA mediante DNS de Cloudflare y rechaza direcciones locales, privadas, reservadas y túneles de transición. Revalida URL y DNS en cada redirección, hasta tres saltos, sin reenviar cookies, clave Admin o cabeceras del usuario.

Solo lee HTML, hasta 750.000 bytes reales y con tiempo máximo de ocho segundos. No descarga un documento entero para recortarlo después. Cancela respuestas excesivas y no acepta otro tipo de archivo. El descubrimiento de enlaces aplica los mismos controles y omite enlaces inseguros.

Las revisiones de fuentes procesan hasta dos por llamada, con cinco segundos por fuente. Se priorizan las menos revisadas y Admin informa cuántas quedan. Revisar no publica candidatos ni activa una tarea programada.

**Límite explícito:** comprobar DNS antes de `fetch()` no fija la conexión a esas IPs. No se declara resuelto el rebinding de DNS ni se da por aprobada la seguridad productiva del capturador. Antes de producción se requiere una salida de red controlada que conecte exclusivamente a destinos validados. Esta entrega reduce las vías conocidas y prepara QA restringida a la fuente sintética propia; no reemplaza ese control.

Referencias: [política de redirecciones de Workers](https://developers.cloudflare.com/workers/runtime-apis/request/) y [prevención SSRF de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html). No se cambia ninguna compatibilidad o protección de Cloudflare.

## Admin y prueba preparada

El enlace puntual y el candidato usan un mismo editor. Se revisan origen, título, descripción y vigencia; no se presenta JSON técnico al operador. No se informa éxito hasta recibir confirmación del lote. Se bloquea el doble envío, se conserva el borrador ante error y un resultado incierto exige analizar otra vez. Una respuesta tardía no cierra otro editor ni cambia de sección.

La captura primero comprueba health y exige **11761 o posterior**. Con 11760 queda bloqueada antes de consultar una fuente. Esto permite publicar Pages sin usar el capturador viejo mientras se completa el despliegue manual del Worker. CSV y los accesos privados existentes siguen disponibles.

Fuente sintética preparada en Pages: `/tests/staging-job-source.html`. Contiene únicamente una convocatoria ficticia con JSON-LD, acentos, Rosario/Santa Fe y plazo 2026-11-24. No recibe postulaciones ni publica nada por sí sola. No se incorpora contenido real de terceros para fabricar una QA.

## Validación

Pruebas focalizadas aprobadas localmente: **54 Worker** (las 35 anteriores y 19 grupos nuevos) y **132 Pages/Admin**. Incluyen medianoche UTC, renovación, calendario, cuerpo inválido/excesivo, DNS privado en ambas familias, redirecciones, límite y cancelación de lectura, timeout, extracción, identidad, duplicados, capacidad, cierre concurrente, rollback, resultados incompletos, doble clic, conservación de borradores y vistas reemplazadas.

También se verifican fuente embebida, sintaxis, política pública, compatibilidad KV y los doce controles estáticos de Radio. No equivale a QA de todos los módulos ni a concurrencia HTTP independiente en Cloudflare. Las fallas previas de otros módulos siguen registradas en continuidad.

La normalización no descubre todos los alias posibles de una misma página. La validación CSV del frontend sigue siendo conservadora ante dos URLs que solo difieren en mayúsculas dentro de un mismo archivo; el Worker preserva la identidad sensible a mayúsculas de ruta y consulta.

El último respaldo remoto verificado es de **11760**: 11 ofertas, 10 postulaciones, tres vínculos y una marca de aviso, versión 3 del mismo archivo privado. Esta preparación no modifica esos datos y no genera un respaldo nuevo ficticio.

## Paso manual: una sola actualización del Worker

1. Descargar `worker.js` de esta entrega, o el ZIP `releases/uadav-api-staging-11761.zip` y extraerlo.
2. En Cloudflare → Workers & Pages → **uadav-api-staging** → Edit Code, reemplazar el archivo completo y desplegar. Conservar DB=`uadav-staging-db`, KV=`uadav-staging-kv`, `JOB_STORE_D1=true` y mantenimiento desactivado. No ejecutar SQL ni cambiar variables, secretos, rutas, cron o producción.
3. Abrir `https://uadav-api-staging.uadavstream.workers.dev/api/health`: debe decir **11761**, D1/KV disponibles, correo y cola apagados. Después avisar «hecho» para retomar la QA autenticada.

No usar este archivo en `uadav-api` ni en producción. Si hiciera falta volver al código anterior, conservar D1 como autoridad: volver a KV requiere reconciliación y no es un rollback válido.

## Siguiente comprobación remota

Después del despliegue: recuperar Admin de forma segura, revisar la fuente sintética, confirmar una ficha ficticia, repetir sin duplicar y dejarla oculta. Verificar día local/plazo en una oferta de QA y conservar sus candidaturas. Generar un respaldo posterior y cotejarlo. No crear otra cuenta personal porque haya caducado una sesión; recuperar la cuenta previa mediante su mecanismo privado cuando haga falta.

Permanecen pendientes restauración remota en una base desechable, email transaccional completo, cuenta/dispositivo independientes, concurrencia HTTP separada, aviso remoto posterior al vencimiento/cron, fuentes reales y dispositivos restantes. Bolsa todavía no cumple la puerta de salida a Cartelera.
