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

## Código preparado: build 11758, todavía no desplegado

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

El modo nuevo requiere **`JOB_STORE_D1=true` y una migración validada**. No se habilitó ninguna variable. No usarlo en producción. La protección por hostname rechaza su uso fuera del Worker staging.

## Pruebas ejecutadas localmente

`node --test tests/job-store-integration.test.mjs`: nueve grupos aprobados con SQLite real y KV simulado. Incluye concurrencia, acceso legado, dos canjes simultáneos, fallas SQL inyectadas, rollback entre colecciones, restauración repetida, cierre concurrente y migración interrumpida.

`node tests/job-application-integration.mjs`: compatibilidad KV aprobada con publicación inmediata aunque la moderación global esté activada, consentimiento, separación de ofertas, claves hasheadas, cierre, renovación y vencimiento.

`node tests/bolsa-public-policy.test.cjs`: política pública y privacidad aprobadas.

`node --test tests/job-status-contract.test.cjs`: cuatro controles aprobados.

`node scripts/test-radio-studio-hardening.mjs`: doce controles estáticos aprobados.

**Incidencia previa reproducida sin cambios:** `tests/radio-studio-integration.mjs` falla sobre una base SQLite vacía porque su preparación no instala `radio_operators`. Reproducido también con el commit inicial. No equivale a una falla confirmada del Radio Studio publicado; tampoco permite declarar aprobada su integración local.

## Lo que falta para terminar Bolsa

1. Desplegar 11758 solo en staging y confirmar acceso y bindings a recursos exclusivos de pruebas.
2. Respaldo externo actual; instalar ambos SQL de staging y validar recuperación en una base desechable.
3. Ejecutar migración controlada, revisar comparación y probar acceso legado/nuevo antes de activar D1.
4. Repetir circuitos reales PC y móvil. No se realizaron publicaciones nuevas desde el navegador en este turno.
5. Vincular comprobantes explícitamente a Mi Perfil/cuenta. No vincular por coincidencia de correo. Actualmente continúa el seguimiento por comprobante privado.
6. Completar el circuito de entrega de correo: proveedor, token, límites, reintentos y entrega confirmada. El núcleo SQL aprobado no prueba entrega de email.
7. Completar seguimiento de notificaciones, avisos de estado/vencimiento, importación masiva desde Admin y prueba real de restauración. El código nuevo no habilita automáticamente estos servicios.

**Bolsa todavía no está terminada ni validada de punta a punta.** Cartelera queda después de esta puerta de salida. No hay despliegue productivo autorizado.

Documentación técnica utilizada: https://developers.cloudflare.com/d1/worker-api/d1-database/ y https://developers.cloudflare.com/d1/platform/limits/.
