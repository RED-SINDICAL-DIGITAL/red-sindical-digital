# UADAV Stream — Prueba real de cuentas artísticas en staging

**27/11/2026 — Procedimiento preparado; sin autorización de ejecución todavía.**

## Situación comprobada

- PR #74 (borrador) HEAD `6c95733b57febdad08b88c7d3ff13b7635a6ab08`. Los cinco controles de GitHub y el preview de Cloudflare Pages pasaron.
- Cloudflare Pages preview del PR: identificador `cf8cf0b5`. Dominio canónico `https://uadav-stream-staging.pages.dev`: corresponde al commit anterior `7e39b1f`.
- El flujo de acceso por correo en `entrar-correo.html` / `uadav-account-email.js` acepta exclusivamente el dominio de producción y el dominio **canónico** de staging. **Los previews por subdominio no pueden completar un enlace de correo**.
- La capa de API de staging apunta a `uadav-api-staging.uadavstream.workers.dev`; la correspondencia de bindings y credenciales debe reconfirmarse antes de probar escrituras.
- No se dispone aún de dos buzones sintéticos controlados para probar dos titulares.

## Autorización limitada solicitada

**Solo staging.** Autorizar temporalmente que el dominio canónico de Cloudflare Pages de staging sirva los archivos del commit exacto del PR #74, con respaldo del deployment previo y posibilidad de restauración. No se autoriza merge, Worker deploy, cambio de secrets, migraciones D1/KV, desactivación de Turnstile ni modificación de producción. Si Cloudflare exige un deploy distinto del reposicionamiento de Pages o afecta otros entornos, detener y volver a solicitar autorización.

## Procedimiento de rollback de Cloudflare Pages (verificado con documentación oficial, 27/11)

**Distinguir ámbitos:** la expresión `production deployment` de Cloudflare Pages se refiere al deployment principal **del proyecto `uadav-stream-staging`** que atiende `uadav-stream-staging.pages.dev`; **no** al sitio público `uadavstream.com.ar` ni al Worker `uadav-api`.

Según Cloudflare, el menú de reversión se encuentra en **Workers & Pages > proyecto Pages > Deployments > All deployments**, sobre el registro de un **deployment principal exitoso**; los **preview deployments no pueden utilizarse como destino de rollback**. La API ofrece también `POST /accounts/{account_id}/pages/projects/{project_name}/deployments/{deployment_id}/rollback` y requiere permiso Pages Write. Referencias: https://developers.cloudflare.com/pages/configuration/rollbacks/ y https://developers.cloudflare.com/api/resources/pages/subresources/projects/subresources/deployments/methods/rollback/ .

- Work debe **verificar en modo de solo lectura** que el deployment principal anterior `0ef5cd49-0d2f-4602-ac7b-6487803b18cd` está retenido, es un deployment principal exitoso y es apto para rollback. Conservar fecha, commit y el identificador completo sin secretos.
- **No es suficiente** que se pueda abrir la URL del preview `cf8cf0b5`; un preview no puede simplemente promocionarse mediante la operación de rollback.
- Verificar el mecanismo de publicación del commit aprobado en la rama principal **del proyecto staging** y el mecanismo exacto de retorno, antes de pedir aprobación de cambio.
- Si falta la opción en dashboard, comprobar **solo metadatos y permisos** de API, sin ejecutar POST alguno; no deducir que el rollback está disponible sin evidencia del endpoint y de la elegibilidad del destino.
- La retención de deployments es limitada: según la actualización de Cloudflare del 19/11/2026, se conservan al menos la versión principal en ejecución, las versiones recientes dentro de las reglas de retención y las 100 más recientes. Comprobar que el deployment anterior sigue disponible al momento del ensayo.
- Una vez autorizado el cambio, Work deberá volver a verificar que el dominio canónico de staging sirve el commit exacto del PR #74 y que todas las llamadas API continúan dirigiéndose exclusivamente al Worker staging. Si el rollback no se puede ejecutar o verificar, **abortar**, sin cambiar dominio, secretos ni producción pública.

## Secuencia previa, en Work

1. Leer metadatos de Cloudflare Pages y registrar identificador, commit, rama, fecha y dominio del **deployment canónico anterior** (`7e39b1f`). Confirmar una operación de rollback real disponible.
2. Confirmar el SHA del artefacto candidato (`6c95733...`), que contiene exactamente el frontend revisado; certificar que su `uadav-api-config.js` dirige todo tráfico API a staging. Comparar manifest y cabeceras de seguridad. Confirmar que los hostnames de Turnstile y enlaces emitidos sean compatibles con el dominio canónico de staging.
3. Confirmar D1, KV, Workers routes, hostname, variables sin revelar valores secretos y separación frente a producción. Si algún punto es dudoso, **NO desplegar**.
4. Obtener autorización explícita del titular del proyecto para cambiar temporalmente la versión servida en el dominio canónico de **staging**.
5. Cambiar **solo el deployment frontend de Pages staging**, sin tocar la configuración ni el Worker. Verificar el commit publicado por el dominio canónico, cargar la app y comprobar que no se llama a API productiva.
6. Preparar dos correos sintéticos bajo control del responsable en Work, por un canal de acceso autorizado (nunca publicar contraseñas ni tokens en GitHub/chat). No usar datos reales de usuarios.
7. En dos navegadores aislados: crear titular artístico sintético con **Turnstile real**; verificar que su segunda sesión obtiene autorización legítima; negar acceso a otra identidad; comprobar la recuperación por correo y que una credencial anterior revocada deja de funcionar. Registrar capturas solo con información no sensible.
8. Confirmar que la prueba no tocó producción. Borrar únicamente los registros sintéticos creados para QA mediante procedimientos aprobados y auditables si corresponde.
9. **Revertir** el dominio canónico de staging al deployment anterior registrado en el paso 1, salvo nueva autorización expresa para mantener el candidato. Verificar commit y API de staging tras rollback.

## Criterios de aprobación / parada

- Se detiene si no hay buzones sintéticos autorizados, Turnstile falla, el dominio envía una petición a API de producción, el rollback no es verificable, hay diferencias no revisadas en Worker, o faltan permisos.
- No se considera aprobado el circuito de identidad si solo pasó SQLite con Turnstile simulado, ni si se probó un alias de staging con otro SHA.
- Mantener PR #74 como borrador hasta documentar el resultado de todas las pruebas y una propuesta de release segura que considere la diferencia entre `main` y el Worker productivo.
- Las pruebas de favoritos/playlists A↔B ya aprobadas por Work se mantienen como evidencia y **no deben repetirse** sin nueva causa.

## Resultado esperado de Work

Tabla **aprobado / falló / bloqueado** por escenario, SHA frontend y Worker usado, hostname exacto, pruebas de rollback, confirmación de cero cambios en producción, decisión sobre integración y pendientes. Al terminar: «Volvé a Chat».
