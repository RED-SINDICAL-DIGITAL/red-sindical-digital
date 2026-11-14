# UADAV STREAM · Pase controlado a staging principal

## Estado y alcance
- Repositorio: `RED-SINDICAL-DIGITAL/red-sindical-digital`.
- Base funcional staging: `audit/continuidad-demo-20261019`, commit `0b82dcf36f498b26a524c30e3f5a109c92df5659`.
- Candidato: `integration/staging-preserve-beta-20261109` / PR [#54](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/pull/54).
- Preview aislado: https://integration-staging-preserve.uadav-stream-staging.pages.dev
- Página principal staging que **NO se reemplaza** sin completar esta lista: https://uadav-stream-staging.pages.dev
- Worker staging: https://uadav-api-staging.uadavstream.workers.dev
- **Producción, Worker y D1/KV no forman parte del PR.** No se cambia ninguna vinculación de producción ni se restauran tablas desde el Admin.

## Puerta 1 — Validación automatizada
- [ ] `Platform integration checks`, `Bolsa UI staging checks`, `Staging integration preservation checks`, `Staging integration offline visual QA`, `Published staging preview acceptance` y `Job status contract checks` en verde **para el mismo SHA del candidato**.
- [ ] Revisar capturas de tres tamaños del workflow remoto: `profile-*`, `shell-*`, `admin-*`.
- [ ] Comparación PR contra `audit/continuidad-demo-20261019` sin modificaciones de `worker.js`, archivos de secretos, enlaces de producción ni scripts de migración.
- [ ] Confirmar URL y SHA de la vista previa en el comentario Cloudflare Pages del PR.

## Puerta 2 — Aceptación con cuentas de pruebas
Estas comprobaciones deben hacerse con cuentas **de laboratorio**, nunca con claves de usuarios finales o datos productivos.
- [ ] Mi Perfil: abrir Cuenta, Mi artista, Mis trabajos y Mis eventos; comprobar retorno y navegación móvil/PC.
- [ ] Bolsa: revisar ofertas y postulaciones sintéticas de la cuenta QA; no enviar postulaciones a productoras reales.
- [ ] Cartelera: cuenta QA puede ver sus eventos y abrir editor. No editar eventos reales.
- [ ] Radio Studio: cuenta operadora QA de emisora **de pruebas** puede entrar y cambiar Manual → Automático → Pausado → Manual; verificar mensajes pendientes sin publicar respuestas reales.
- [ ] Radio Studio: revocar la cuenta QA y verificar pérdida del acceso sin revelar datos de otra emisora.
- [ ] Admin: entrar con cuenta administrativa **staging** y confirmar módulos, permisos y mensajes de entorno. No probar cambios sobre datos ajenos.
- [ ] Admin: descargar datos sintéticos CSV/JSON y revisar respaldo, sin importar contenido real ni restaurar D1.
- [ ] Validar reproducción persistente al navegar, tanto con audio sintético como con una emisora de pruebas habilitada.

## Puerta 3 — Respaldo verificable (operación en Cloudflare, no en el navegador público)
- [ ] Obtener copia **solo lectura** de KV y D1 del entorno staging **correcto**. Verificar en Cloudflare los bindings de la instancia antes de exportar.
- [ ] Confirmar la integridad del respaldo: `backup_integrity.complete=true`, colecciones `bolsa_trabajo` y `postulaciones_trabajo` presentes como listas; tablas D1 legibles. Conservar checksum SHA-256 del archivo.
- [ ] Ejecutar en un equipo privado, **fuera de GitHub Actions**, el verificador local del repositorio: `node scripts/verify-staging-backup.mjs "RUTA_PRIVADA_AL_ARCHIVO.json"`. Debe devolver `verified: true` y `sha256`. Esta prueba es de **estructura e integridad declarada**, no demuestra por sí sola que se pueda restaurar D1/KV.
- [ ] Conservar el hash SHA-256, fecha y resultado de la verificación en el registro de aprobación; **nunca** incorporar el JSON original, sus filas, correos ni contraseñas al PR.
- [ ] Guardar archivo en espacio privado cifrado, con control de acceso y fecha. **Nunca** subir contenido del respaldo, credenciales o emails de usuarios al repositorio ni adjuntarlos al PR.
- [ ] Confirmar restauración en entorno **desechable** o disponer de plan de restauración manual documentado y probado. El botón de restauración del Admin continúa bloqueado deliberadamente.
- [ ] Confirmar en Cloudflare que la rama de Pages a modificar es la de **staging**, no la producción UADAV.

## Evidencia de autorización (sin datos privados)
El script `scripts/staging-release-gate.mjs` determina si el candidato está listo a partir de un archivo **local y privado de metadatos**. No consulta Cloudflare, no genera respaldos y no autoriza despliegues por sí solo. Ejecutar `node scripts/staging-release-gate.mjs "RUTA_PRIVADA_EVIDENCIA.json"` en el equipo encargado del pase.

Campos requeridos: `candidate_sha` (40 caracteres hex), `ci` con las cinco suites exitosas y exactamente ese SHA, `backup.environment="staging"`, `backup.verified=true`, `backup.sha256` (64 caracteres hex), `backup.kv_exported=true`, `backup.d1_exported=true`, `backup.restore_plan_approved=true`, `backup.restore_rehearsal_verified=true` y `backup.restore_rehearsal_sha256` igual al SHA-256 del respaldo realmente ensayado, y `qa.admin_authenticated`, `qa.radio_operator_authenticated`, `qa.profile_authenticated`, `qa.responsible_approval`, todos `true`. Estos datos deben representar **pruebas y aprobaciones efectivas**, nunca completarse de forma ficticia.

Si cualquiera falta, el verificador devuelve `ready:false` y el pase queda bloqueado. No subir este archivo de evidencia ni el respaldo original al PR.

## Puerta 4 — Cambio controlado y reversión
1. Congelar el SHA candidato, anotar el SHA anterior y preservar URL de build anterior.
2. Publicar la misma versión **solo** en staging principal después de aprobar las puertas 1–3.
3. Verificar portada, navegación, Mi Perfil, Bolsa, Cartelera, En Vivo/Radio y Admin con usuarios QA.
4. Si hay fallos de navegación, API, sesiones o reproductor, revertir el despliegue de Pages al build anterior verificado. **No ejecutar restauraciones de datos** por un fallo visual.
5. Si el fallo implica escritura o integridad, detener operaciones administrativas; diagnosticar en staging y usar respaldo solamente mediante proceso supervisado.
6. Registrar SHA y revisión, capturas QA, fecha, incidencia, resolución y autorización del pase.

## No-go automático
No fusionar ni desplegar si: alguna CI falla, hay divergencia entre preview/commit, no existe respaldo íntegro, falla el aislamiento staging→producción, los permisos se cruzan entre cuentas, o se requiere modificar Worker/D1 sin plan propio.

## Riesgos aún abiertos
- Pruebas sintéticas NO validan autenticación operativa real ni integraciones externas.
- Conservar estado de radio/video al *recargar* la página depende de políticas de reproducción del navegador; no prometer autoplay sin gesto.
- La API y las operaciones de importación/exportación autenticadas requieren aceptación manual en staging.
- Ninguna prueba realizada hasta el momento constituye autorización para cambiar producción.

## Continuidad de revisión · 11 de noviembre de 2026

- Navegación Mi Perfil → Radio Studio y acceso táctil comprobados en preview.
- Lectura autenticada de Cuentas, Bolsa, postulaciones, Cartelera y Auditoría comprobada; no se guardaron cambios.
- Cuenta Ruso Radio QA: permiso activo comprobado desde administración para Beat Digital Radio. Esto no sustituye la prueba autenticada con la cuenta operadora.
- Pendiente: el endpoint de radios excluye emisoras ocultas incluso para administración. La emisora de pruebas oculta no se puede verificar desde ese selector. Requiere una solución de backend en otra etapa autorizada; no cambiar el Worker en esta revisión.
- El verificador local exige ahora catálogo KV de radios y tablas D1 de ofertas, postulaciones, eventos, radios, cuentas, dispositivos, vínculos de artistas y operadores. Un indicador `complete=true` no sustituye estas comprobaciones.
- La aceptación exige evidencia de un ensayo de recuperación aislado y del mismo archivo identificado por SHA-256. Un plan aprobado o una validación estructural no acreditan recuperación.
- No se realizó recuperación del respaldo real ni aceptación final. Mantener el PR como borrador, sin fusionar ni reemplazar staging principal.
