# Beta UADAV STREAM — puerta de despliegue a staging

## Alcance aprobado
- PR #51: rama `release/beta-staging-candidate-20261108`. Contiene protección de edición de eventos en Worker y pruebas corregidas de membresías retiradas y reproducción.
- PR #52: rama `feat/beta-staging-profile-20261108`, creada **sobre** PR #51. Incorpora Mi Perfil, dependencias y PWA. Es el candidato combinado, no hay que desplegar PR #51 aparte.
- El Worker de la rama combinada se mantiene idéntico al del PR #51. Ningún ZIP de QA sintético debe desplegarse como Worker.

## Antes de desplegar
1. Confirmar GitHub Actions `Beta native Mi Perfil staging checks` y `Platform integration checks` en **success** para el commit exacto de PR #52. No desplegar si cambió la rama desde la verificación.
2. Verificar copia recuperable/exportación de los datos **staging** KV y D1; no restaurar ni modificar producción.
3. Verificar el proyecto exacto de Cloudflare Pages `uadav-stream-staging`, su rama fuente y sus variables de entorno. La integración GitHub/Pages puede publicar automáticamente al actualizar esa rama; no cambiar la rama de producción.
4. Desplegar la web estática desde PR #52 **solo al proyecto staging**. Si Worker de staging ya tiene `event_owner_revision:20261107-owner-verified-v1`, no redeplegarlo innecesariamente. Si se precisa Worker, publicar la versión de esta rama únicamente al Worker `uadav-api-staging`, preservando sus bindings existentes y con respaldo previo.
5. No copiar `.github/`, `tests/`, `scripts/`, `releases/`, ZIP de QA, ni credenciales al directorio público.

## Después de desplegar
Ejecutar desde una máquina con Node 22+ o workflow manual `Beta staging live read-only verification`:

```sh
node scripts/check-beta-staging-live.mjs
```

La verificación es solo GET: confirma HTML de Mi Perfil, revisión PWA y estado KV/D1/propiedad de eventos del Worker de staging. También comprobar manualmente en Android y escritorio: navegación inferior (Explorar, En vivo, Cartelera, Trabajo, Mi Perfil), alta/edición de eventos propios, publicación de empleo, Radio Studio (Manual/Automático/Pausado), recuperación por correo de prueba y reproducción persistente. No usar cuentas reales ni pagos reales para QA.

## Salida y rollback
Si aparece un problema, revertir **solo Pages de staging** a su despliegue anterior desde el historial de Cloudflare. Si se actualizó el Worker de staging, volver al Worker previo solo tras comprobar compatibilidad con D1/KV actuales; evitar restaurar bases salvo incidente de datos comprobado y respaldo validado. Registrar commit, despliegue Pages, Worker build y capturas del fallo. Mantener producción sin cambios hasta aprobación expresa.
