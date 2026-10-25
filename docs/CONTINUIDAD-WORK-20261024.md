# UADAV STREAM V11.7 · continuidad verificada en Work · 24/10/2026

## Alcance y punto de partida

Repositorio: RED-SINDICAL-DIGITAL/red-sindical-digital. Únicamente staging.
No se fusionaron ramas ni se modificó `main`.

| Entorno | Estado inicial comprobado |
| --- | --- |
| Pages | `audit/continuidad-demo-20261019`, commit `1a58266293e0c10a4be361d17179ffedb3b2aa5e` |
| Worker | `release/radio-studio-staging-rc-20261020`, commit `e43b32629cdf3cb42920351f8339c05086d211af` |
| Worker publicado | `/api/health` devuelve build **11757**, KV/D1 activos, correo y cola desactivados |
| Pages publicado | El navegador abre `https://uadav-stream-staging.pages.dev`, Bolsa muestra cinco oportunidades |
| Cloudflare | El panel redirige al inicio de sesión. No se instalaron migraciones ni variables |
| CI previo | Run `40056120973`: política de Bolsa aprobada; run `40056120964`: controles estáticos Radio aprobados |

## Código build 11758 · desplegado solo en staging

- Fuente mantenible `scripts/job-store-runtime.js`, incorporada al Worker de un solo archivo con `scripts/embed-job-store.mjs`.
- Almacenamiento D1 por registro para ofertas y postulaciones; credenciales de contratantes en tabla independiente.
- Inserción de oferta y credencial en una misma transacción. Índice único del identificador de solicitud.
- Control de versión por registro. Dos ediciones de ofertas distintas no se pisan; un conflicto revierte el lote entero.
- La postulación vuelve a comprobar dentro de la transacción la versión de la oferta consultada. Un cierre concurrente cancela el envío.
- La oferta vencida, cerrada o pendiente de revisión externa no admite postulaciones. Fechas calendario válidas y día de Argentina.
- Migración administrativa con simulación, huella del origen, mantenimiento, lotes de tres, reintentos idempotentes y comparación final completa. No borra ni reescribe KV.
- Límites de intentos atómicos en D1 para el nuevo modo. Limpieza de contadores y tokens vencidos en mantenimiento programado, sin agregar cron alguno.
- El backup incluye los registros D1 y las credenciales. La copia compatible `kv` del backup contiene el estado actual de D1, no el KV antiguo.
- Restauración de hasta cinco faltantes por operación: una transacción para ofertas y postulaciones, sin sobrescribir existentes; desactivada por defecto.
- Núcleo de recuperación: consumir token y rotar credencial en la misma transacción, con revisión y expiración. **Los dos endpoints de correo continúan devolviendo 503.**
- Las respuestas privadas no se cachean. Errores laborales sin SQL, hashes o claves en el mensaje.
- No se ejecuta el bootstrap general de D1 como requisito de una escritura laboral en el nuevo modo.
- Importación externa en modo D1: hasta cinco ofertas por lote, origen HTTPS validado e identificador determinista para evitar duplicados simultáneos.

El modo nuevo requiere **`JOB_STORE_D1=true` y una migración validada**. El usuario instaló las tablas, completó la copia de 5 ofertas y 5 postulaciones y activó D1 en staging. Después retiró mantenimiento y el navegador de Work comprobó escrituras y lecturas nuevas. El detalle y la evidencia están en `docs/BOLSA-11758-POST-DEPLOY.md`. No usarlo en producción. La protección por hostname rechaza su uso fuera del Worker staging.

## Pruebas ejecutadas localmente

`node --test tests/job-store-integration.test.mjs`: nueve grupos aprobados con SQLite real y KV simulado. Incluye concurrencia, acceso legado, dos canjes simultáneos, fallas SQL inyectadas, rollback entre colecciones, restauración repetida, cierre concurrente y migración interrumpida.

`node tests/job-application-integration.mjs`: compatibilidad KV aprobada con publicación inmediata aunque la moderación global esté activada, consentimiento, separación de ofertas, claves hasheadas, cierre, renovación y vencimiento.

`node tests/bolsa-public-policy.test.cjs`: política pública y privacidad aprobadas.

`node --test tests/job-status-contract.test.cjs`: cuatro controles aprobados.

`node scripts/test-radio-studio-hardening.mjs`: doce controles estáticos aprobados.

**Incidencia previa reproducida sin cambios:** `tests/radio-studio-integration.mjs` falla sobre una base SQLite vacía porque su preparación no instala `radio_operators`. Reproducido también con el commit inicial. No equivale a una falla confirmada del Radio Studio publicado; tampoco permite declarar aprobada su integración local.

## Lo que falta para terminar Bolsa

**Avance posterior:** el Worker 11759 y la tabla adicional ya se comprobaron mediante el circuito autenticado de una cuenta ficticia creada manualmente por el usuario. En PC de Work se probaron guardado voluntario, una postulación sin vincular, persistencia, privacidad de campos opcionales, acceso a candidatos, cierre/renovación, cambio de estado desde Admin y avisos leídos. Dos defectos detectados en Pages se corrigieron y se verificaron publicados en `43f60b7f6e49e66a95ac659124bd85bd042f1dd8`; CI `40118351789` aprobado con 84 pruebas. El usuario completó también publicación, postulación, apertura del archivo del contratante, consulta de candidatos y cierre desde el celular. Servidor y Admin corroboran la oferta `JOB-MVMT57YC-897E34406860` cerrada y su candidatura `POST-MVMT9Y4B-F51EE764` conservada con consentimiento registrado. El nuevo backup privado contiene **8 ofertas, 9 postulaciones y 2 asociaciones** consistentes; conserva la versión anterior. Las cinco ofertas públicas originales permanecen iguales. Ver `docs/BOLSA-11759-MI-PERFIL-STAGING.md` y sus capturas de evidencia.

1. Conservar el respaldo D1 posterior, ya descargado y verificado; validar restauración en una base desechable. El despliegue 11758, el esquema y la migración inicial ya se completaron en staging.
2. Probar acceso remoto con un comprobante legado de QA. El acceso de una oferta nueva y el rechazo de clave incorrecta ya fueron comprobados.
3. Probar concurrencia HTTP independiente en Cloudflare. El doble clic de la interfaz y la concurrencia local/CI están comprobados.
4. Completar casos de cuenta en móvil y repetir los circuitos en tablet/Smart TV. Publicación, postulación, consulta de candidatos por archivo, cierre y seguimiento posterior con el archivo de la candidatura fueron confirmados por el usuario desde el celular; el servidor corroboró cierre y conservación de la candidatura. En PC de Work ya se completaron publicación, postulación, privacidad, seguimiento, cierre, rechazo desde pantalla desactualizada y renovación con datos ficticios.
5. Completar el vínculo explícito con Mi Perfil en una segunda cuenta independiente, con un dispositivo aprobado y un comprobante anterior. El circuito de cuenta A ya está desplegado y validado en PC. No vincula por coincidencia de correo; conserva el seguimiento por comprobante privado.
6. Completar el circuito de entrega de correo: proveedor, token, límites, reintentos y entrega confirmada. El núcleo SQL aprobado no prueba entrega de email.
7. Completar el aviso remoto posterior al vencimiento y verificar la ejecución programada real, entrega externa de notificaciones, importación desde Admin y restauración. **El aviso próximo a vencer de 11760 ya pasó QA real**: oferta `JOB-MVN0OQA5-28B033C1422D` vinculada, candidatura `POST-MVN0P9GO-56F2C26E` sin guardar, un aviso interno entregado y leído, repetición con cero pendientes, renovación hasta 2026-11-23 y cierre final con candidatura conservada. La Bolsa pública conserva las cinco ofertas originales. El respaldo de ese ensayo fue 11760 con 9 ofertas y 10 postulaciones, versión 2. Después de la QA de importaciones, el respaldo actual conserva **11 ofertas, 10 postulaciones, 3 vínculos y 1 marca de aviso**, consistente y guardado como versión 3 del mismo archivo privado. El alta de la cuenta de esta sesión la completó el usuario. Worker fuente `83f8cb307260d0d105f1ff6d7ed9f6a14a139006`, CI Bolsa `40134086445`; no cambió. Pages corrigió también el error silencioso al guardar una oferta y el identificador requerido para crearla: `1ab6a4f8b6acc15199a72f09f1007ef4bbb50eb0`, CI `40142314409`, **100 pruebas**. Publicación y rechazo visible/guardado válido comprobados. El editor rechaza fechas pasadas: este ensayo no valida el aviso posterior al vencimiento ni un cron. Correo y cola siguen apagados. Ver `docs/BOLSA-11760-AVISOS-STAGING.md`.

8. **Importación CSV real ya verificada con datos sintéticos.** Se corrigieron la visibilidad ignorada, la posible duplicación por ausencia de ID y la pérdida de origen externo de la ruta genérica. Pages usa ahora la ruta externa existente con URL como identidad y hasta cinco ofertas por lote. El CSV inicial reveló conversión de fecha a número y acentos incorrectos antes de escribir; se corrigió el lector y se reemplazó SheetJS 0.18.5 por distribución oficial 0.20.3 local. Pages `9967c6c038f8ad0725ce4825adbd31f3a0b8d339`, CI `40143976001`, **120 pruebas aprobadas** y control de importación/exportación. Se incorporó una oferta oculta, repetirla dio cero nuevas y una actualización, se publicó otra con etiqueta externa y su botón abrió el origen correcto. Ambas quedaron ocultas y el catálogo conserva cinco ofertas. No se valida con esto scraping o descubrimiento automático. Ver `docs/BOLSA-11760-IMPORTACIONES-QA.md`. Las guías pública e interna se actualizaron en la rama Pages. Quedan por armonizar en Worker las validaciones de fechas que todavía comparan con el día UTC, además de los pendientes de restauración, correo y dispositivos.


**Auditoría ampliada de Pages:** todos los `*.test.cjs` arrojaron 509/555 aprobadas y 46 fallas, reproducidas también en el commit base `0075f41` sin los últimos ajustes visuales. Mantener este pendiente de otros módulos separado de las 84 pruebas específicas aprobadas. No afirmar que toda la plataforma pasa las pruebas.

**Bolsa todavía no está terminada ni validada de punta a punta.** Cartelera queda después de esta puerta de salida. No hay despliegue productivo autorizado.

Documentación técnica utilizada: https://developers.cloudflare.com/d1/worker-api/d1-database/ y https://developers.cloudflare.com/d1/platform/limits/.

## Entrega siguiente preparada: 11761

El usuario pidió continuar. Se prepararon correcciones de fechas de Argentina (incluido plazo por defecto/renovación), captura de fuentes con controles DNS/redirección/tamaño/tiempo e identidad externa segura, con conservación de cierres y guardas transaccionales. Admin unifica la revisión por URL y candidato, conserva el borrador y exige un Worker nuevo antes de consultar HTML. Fuente sintética propia lista para el ensayo. Ver `BOLSA-11761-FECHAS-Y-FUENTES-STAGING.md`.

Al iniciar esta entrega el navegador observó todavía 11760, correo y cola apagados. El despliegue 11761 es manual y no requiere SQL, flags o credenciales nuevas. El respaldo de datos verificado sigue siendo 11760 versión 3. No se modificó producción. La consulta DNS previa no equivale a pinning de la conexión: la seguridad productiva de ese egreso sigue pendiente.


**Entrega registrada:** Worker código `dab7e96fd0a71553e91bcc093329fde966b9e418` (54 pruebas y CI Bolsa/Radio verdes); Pages `fcb77c56fcddfc7136f05748aea532756c415958` (132 pruebas y CI verde), desplegado y cotejado por manifiesto. Worker remoto todavía **11760** a las 23:34 del 24 de octubre en Argentina; ZIP 11761 verificado y despliegue manual pendiente. No hubo escritura de datos remotos. Ver `BOLSA-11761-ENTREGA-20261024.md`.
