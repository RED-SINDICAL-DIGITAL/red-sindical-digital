# UADAV STREAM · Admin 2.0 — auditoría de integración y validación antes de publicar

Fecha: 21 de noviembre de 2026  
Rama: `feature/admin-simple-navigation-20261121` · PR #68 · Issue #67  
**Estado: NO APTO PARA PRODUCCIÓN hasta completar las puertas de salida.**

## Evidencia automática confirmada para commit 40ca15f
- Admin 2.0 regression checks: **PASS**
- Platform integration checks: **PASS**
- Staging integration offline visual QA: **PASS**
- Bolsa UI staging checks: **PASS**
- Job status contract checks: **PASS**
- Staging integration preservation checks: **FAIL — esperado**: la rama cambia `worker.js`, por lo que el hash no coincide con el Worker congelado `d4b68445e67b754b811b93d84a9b7225233e67b3`.

Este último resultado **no se arregla actualizando el hash del test**. Exige revisar el impacto del cambio, las migraciones y el procedimiento de rollback.

## Inventario de cambios relevantes

### Admin y Mi Perfil
- Menú reorganizado en 7 grupos. Los 35 destinos originales siguen presentes.
- Alta directa de artistas autenticados: se conserva la publicación sin aprobación manual previa; las reclamaciones históricas quedan diferenciadas.
- Mensaje de acceso a eventos: no afirma verificación de email donde se usa una credencial privada.

### Notificaciones
- Identificador de aviso con UUID.
- En payload enviado se fuerza `notification_id` generado por el servidor.
- Si el webhook acepta el envío en segundo plano, la cola registra `sent`.
- **Pendiente:** identificar proveedor final (Brevo/webhook), garantizar idempotencia desde origen a proveedor, reintentos simultáneos y confirmar `delivered/bounced`. `sent` significa respuesta HTTP exitosa, NO entrega en bandeja.

### Identidad y recuperación de cuentas
- `GET /api/account/identity` autentica y expone `account_id` y `recovery_version`.
- Nueva `POST /api/account/recovery/atomic` con `request_id`, `new_secret` y `expected_version`, y tabla D1 `audience_recovery_state`.
- Ensayos sintéticos del Worker/SQLite comprobaron éxito, idempotencia, versión obsoleta y revocación de respaldos anteriores.
- **Coexistencia corregida en esta rama:** `POST /api/account/recovery` (heredado) comparte ahora el contador `audience_recovery_state` y el control de versión CAS con `POST /api/account/recovery/atomic`. Una prueba nueva de interoperabilidad sobre SQLite sintético alterna ambos circuitos, comprueba revocación de claves previas y rechaza versiones obsoletas; el workflow específico de Admin 2.0 pasó para el commit `219092f`. La prueba independiente `scripts/test-account-recovery-rollback.mjs` ahora fuerza errores SQL dentro del lote transaccional de ambas rutas y comprueba que la clave y versión originales sobreviven; la suite específica Admin 2.0 aprobó este caso en CI (commit `bfdf5ca`). La prueba `scripts/test-account-recovery-concurrency.mjs` aprobó en el CI del commit `f463f32`, lanzando solicitudes concurrentes en tres combinaciones (atómica/atómica, heredada/atómica y heredada/heredada) contra el Worker y SQLite D1 sintético: una sola solicitud triunfa, hay una sola clave activa y el dispositivo sigue funcionando. Se mantienen pendientes las carreras sobre D1 real de staging, la revisión del esquema y la comprobación de Worker efectivamente desplegado.
- No asumir que la nueva tabla creada bajo `uadavAccountSchema` es compatible con todas las rutas y bindings en staging hasta validarlo con el esquema real.

## Plan de validación en Work / staging aislado
1. **Entorno y respaldo.** Comprobar URL exacta de staging, commit/build y qué Worker responde; verificar binding a D1/KV de prueba y respaldo recuperable. No utilizar cuenta, clave o datos de producción.
2. **Admin PC y móvil.** Entrar como administrador QA; recorrer los 7 grupos y los 35 destinos, búsqueda `cuentas`, `artistas`, `correo`, `moderación`. Confirmar que opciones avanzadas siguen disponibles sólo a roles permitidos.
3. **Cuenta nueva.** Crear cuenta sintética desde la interfaz con Turnstile de prueba y verificar persistencia, cierre de sesión, reconexión y dispositivo adicional.
4. **Perfil artístico.** Crear nuevo perfil desde cuenta, comprobar publicación inmediata, enlace de titularidad, edición, duplicados, revocación y ausencia de revisión previa. Confirmar que los reclamos de perfiles preexistentes siguen protegidos.
5. **Recuperación.** Antes de probar una rotación, resolver coexistencia de endpoint legado/atómico. Probar con claves sintéticas: éxito, reintento, dos dispositivos, error/red interrumpida, reemplazo de clave, revocación e imposibilidad de reusar clave antigua.
6. **Correos.** Usar receptor/bandeja QA y webhook falso primero. Verificar registro de evento, ID único, una aceptación, reintentos sin duplicado, rebote y estado entregado con evidencia del proveedor. Comprobar plantillas y que no se expongan tokens en logs.
7. **Regresión visual.** Capturas y recorridos en PC y viewport móvil, volver desde fullscreen, filtros y publicación; comparar con producción únicamente en modo lectura, sin pruebas destructivas.
8. **Salida.** Adjuntar resultados y capturas, reporte del diferencial Worker vs baseline, migración/rollback documentados; recién entonces solicitar autorización separada para desplegar.

## Regla de aprobación
**No fusionar PR #68, no sobrescribir el Worker congelado ni tocar D1/KV productivos** mientras permanezca algún bloqueo técnico o falte QA de staging. El enlace a GitHub no certifica deployment.
