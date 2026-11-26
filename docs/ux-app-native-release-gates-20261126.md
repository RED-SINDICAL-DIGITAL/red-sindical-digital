# App visual v1 · estado de validación (26/11/2026)

## Alcance confirmado

PR #73 es una capa exclusivamente visual `uadav-app-surface-v1.css`, cargada desde `app.html`. Mantiene el reproductor, radio, navegación, biblioteca, cuenta y autenticación existentes. No es un despliegue.

## Evidencia de GitHub Actions

- En `ebb56f9`, **Staging integration offline visual QA: SUCCESS**.
- `tests/profile-intuitive-ui.test.cjs` contenía una expresión regular fija para `fetch('url')` que no coincidía con el `fetch((origin?...))` actual. Se reemplazó por una comprobación de destinos permitidos y llamada efectiva.
- `tests/stream-visual-shell.test.cjs` presuponía atributos HTML contiguos en el botón «Para artistas». Se ajustó para comprobar ruta, clase, módulo y etiqueta accesible sin depender del orden de atributos.
- **Platform integration checks: FAILURE** en `tests/artist-claim-lifecycle.mjs`. Se observó inicialmente HTTP 503 al intentar el alta con cuenta porque el test no suministra configuración de Turnstile; el Worker exige Turnstile habilitado para ese flujo. Al ensayar un Turnstile sintético, el siguiente supuesto de «borrador pendiente y rechazo» chocó con el alta automática verificada (HTTP 409). Como no se demostró equivalencia de escenarios, se restauró **intacto** el test de `main` sin debilitar ni cambiar `worker.js`. **La prueba sigue bloqueada**: requiere redefinir escenarios por separado (autoregistro con cuenta, solicitud de gestión de artista existente, rechazo de reclamo pendiente), incluyendo pruebas de titularidad, revocación y doble sesión.
- **Staging integration preservation checks: FAILURE** debido a un hash de `worker.js` distinto del baseline congelado. Es un bloqueo independiente, no cambiar el hash ni eliminar el test para pasar.

## Puerta de salida del PR

1. Ejecutar toda la batería de visual y seguridad en SHA final. La prueba visual aislada no equivale a pruebas completas.
2. Reparar las simulaciones de artista contra el contrato funcional vigente sin modificar requisitos de seguridad. Probar dos identidades sintéticas y permisos 403.
3. Resolver preservación de Worker mediante auditoría de diferencias, staging seguro y rollback. No desactivar el gate.
4. QA manual de app/PWA en smartphone, escritorio y TV: navegación, cola, mini/fullscreen, radio, foco de teclado, compartir, accesibilidad y superposiciones.
5. Revisar los PR #70–#72 por separado antes de combinar visuales, biblioteca y avance de reproducción.

**Resultado:** no fusionar, no desplegar a producción. La reentrega al mismo Gmail continúa bajo observación independiente.
