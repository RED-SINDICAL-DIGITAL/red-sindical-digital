# Bolsa de Trabajo · estado y cierre · 25 de octubre de 2026

## Verificación posterior al despliegue manual

El usuario confirmó el despliegue. El navegador comprobó `https://uadav-api-staging.uadavstream.workers.dev/api/health` el `2026-10-25T20:19:09.201Z` (17:19 de Argentina): **V11.7 / 11761**, `ok=true`, `success=true`, D1/KV disponibles, `email_automation=false` y `queue=false`.

Código publicado: `dab7e96fd0a71553e91bcc093329fde966b9e418`; Pages sigue en `fcb77c56fcddfc7136f05748aea532756c415958`. Las 54 pruebas Worker, 132 Pages y CI ya aprobadas corresponden a ese código; esta comprobación no equivale a repetir todas las pruebas de integración en Cloudflare.

El catálogo público mostró las mismas cinco oportunidades. Admin requirió reingreso con clave mediante `browserAuth`, se verificó sesión administrativa activa y D1 OK, sin leer o extraer credenciales.

## Resultado real del capturador: pendiente

En Fuentes automáticas → Agregar una ficha puntual → Bolsa se consultó `https://uadav-stream-staging.pages.dev/tests/staging-job-source`. La interfaz mostró: «No pudimos leer esa página. Usá CSV o carga manual». No apareció una ficha revisada y no se ejecutó ninguna incorporación.

Una segunda consulta a la página pública del propio repositorio `https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital` devolvió el mismo mensaje. Esa página se usó solo para aislar el transporte con otro dominio propio, no como convocatoria laboral. El fallo no queda limitado a Pages por esta evidencia.

[Evidencia del segundo resultado](evidence/bolsa-11761-lectura-pendiente-20261025.jpg).

**Causa aún no determinada.** La respuesta actual agrupa excepciones de transporte, lectura o parseo en el mismo mensaje; no permite atribuir la falla a DNS, Cloudflare, permisos, IP privada o una protección anti-bot. No se cambiaron flags, bindings ni reglas para forzar la consulta y no se probaron rutas alternativas para eludir controles. No se volvió a intentar incorporar ni se creó una oferta, candidatura o cuenta.

La importación CSV ya validada en 11760 sigue siendo el último circuito de importación aprobado de extremo a extremo. No dar por validada la captura por URL solo por pasar las pruebas locales con red simulada. Próximo trabajo: diagnóstico seguro por etapas del capturador, reproducción y corrección, con regresión local y nueva comprobación en staging; después ficha sintética, repetición sin duplicar y ocultamiento.

## Seis bloques para considerar Bolsa completa

| Bloque | Qué falta aprobar | Intervención que puede requerirse |
|---|---|---|
| Fuentes externas | Resolver lectura por URL, probar fuente real autorizada, repetición, cierres, errores y salida pública segura. | Despliegue de una corrección preparada si cambia el Worker; revisar configuración solo con diagnóstico concreto. |
| Recuperación por correo | Integrar proveedor y entrega real, token de un solo uso, vencimiento, límites/reintentos y revocación de la clave anterior en una transacción. Los endpoints siguen en 503 hasta completar las pruebas. | Proveedor, dominio/remitente verificado y secretos ingresados de forma segura. |
| Restauración | Restaurar un respaldo en D1 desechable, cotejar datos, accesos, vínculos y avisos; interrumpir/reintentar y comprobar consistencia. | Crear o seleccionar exclusivamente una base desechable de staging, sin activar restore sobre la base actual. |
| Vencimientos y avisos | Verificar el aviso posterior al vencimiento y la ejecución programada real, sin duplicar ni reabrir ofertas cerradas. El aviso previo ya se comprobó. | Configurar el cron de staging solo cuando el circuito esté preparado y probado. |
| Privacidad y concurrencia | Segunda cuenta independiente, comprobante previo, vínculo voluntario con Mi Perfil/perfil artístico, aislamiento entre cuentas y solicitudes HTTP simultáneas en Cloudflare. | Acceso seguro a la cuenta o dispositivo independiente; no generar otra cuenta por caducidad de sesión. |
| Dispositivos y cierre de UX | Completar circuitos y fallos con cuenta en móvil; tablet y Smart TV, accesibilidad y manuales. Los flujos básicos PC/móvil ya tienen evidencia. | Validación física en los dispositivos no disponibles en Work. |

La publicación gratuita e inmediata, postulación con consentimiento, gestión privada, migración D1, cierre/renovación, moderación posterior, exportación/respaldo e importación CSV cuentan con pruebas previas. Eso no completa los seis bloques pendientes ni acredita disponibilidad productiva.

## Estimación de trabajo

Estimación provisional de planificación: **3–5 jornadas de trabajo efectivo**, condicionadas a accesos, proveedor de correo y entorno desechable disponibles, y a que el diagnóstico no revele otro cambio importante. No es una fecha garantizada ni implica ejecución autónoma fuera de las sesiones. Las esperas de verificación de dominio, correo y dispositivos pueden extender el calendario. No se asigna un porcentaje de avance artificial.

La siguiente prioridad es el fallo real del capturador. Correo, restauración y automatizaciones siguen sin habilitar. Producción permanece en `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`; no se cambió ninguna de sus ramas, recursos o despliegues. El último respaldo privado verificado sigue siendo el de 11760 versión 3; no se fabricó un respaldo nuevo porque estas consultas no escribieron ofertas o postulaciones.
