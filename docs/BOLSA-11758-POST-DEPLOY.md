# Bolsa D1 staging · validación del 24/10/2026

## Código y entornos

- Worker: `release/radio-studio-staging-rc-20261020`. El archivo desplegado sigue siendo el build **11758**, procedente de `cf666a11ac67ff14f7786b63a006e326d88e97b2`. Los commits posteriores agregaron SQL, documentación y pruebas, sin cambiar `worker.js`.
- Pages: `audit/continuidad-demo-20261019`. Antes de estas pruebas, el manifest público confirmó `5c6d9658c5c675e1c5aac121f9a69b46252ca050`.
- Worker staging: `https://uadav-api-staging.uadavstream.workers.dev`.
- Pages staging: `https://uadav-stream-staging.pages.dev`.
- `main` se consultó en GitHub y conserva `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`. No se desplegó ni modificó producción.

## Operaciones ejecutadas por el usuario

Las capturas aportadas mostraron bindings diferentes: staging `DB → uadav-staging-db` y `UADAV_DB → uadav-staging-kv`; producción `DB → uadavstream` y `UADAV_DB → UADAV_STREAM_DB`. La consulta de la consola staging devolvió las siete tablas del instalador unificado.

El informe del panel confirmó **5 ofertas, 5 postulaciones, 10 registros copiados y comparación final confirmada**. Posteriormente, la captura del Admin mostró «Bolsa ya usa D1. No corresponde repetir la migración desde KV». El usuario confirmó el despliegue de `JOB_STORE_D1=true` y luego el cambio de `JOB_STORE_MAINTENANCE=false`. El asistente no ejecutó esas operaciones de Cloudflare.

## Pruebas remotas ejecutadas por el asistente

Se usó el navegador de PC de Work, sin sesión de Admin, exclusivamente contra staging y con personas y correos ficticios del dominio reservado `example.invalid`.

| Comprobación | Resultado observado |
| --- | --- |
| Worker después de cambiar variables | Health devuelve 11758, KV/D1 disponibles, `email_automation:false`, `queue:false` |
| Oferta pública gratuita e inmediata | `JOB-MVMKKOC5-2FBB3925BCDF`, título `QA 11758 · D1 · Prueba integral 24-10`; el catálogo pasó de 5 a 6 |
| Acceso del contratante | Su clave abrió la bandeja; una clave sintácticamente válida e incorrecta fue rechazada |
| Consentimiento explícito | El formulario bloqueó el envío sin marcar autorización; no se emitió comprobante |
| Envío con consentimiento y doble clic | Se emitió `POST-MVMKM73Z-59CB7937`; el contratante vio exactamente 1 postulación recibida |
| Campos opcionales excluidos | Se completaron WhatsApp, portfolio y un mensaje de control, pero se desmarcaron las tres opciones; ninguno apareció en la bandeja del contratante |
| Seguimiento del postulante | El comprobante abrió el estado «Recibida» |
| Cierre del contratante | La oferta desapareció del catálogo; se conservaron las postulaciones |
| Pantalla desactualizada | Una segunda pestaña abrió el formulario antes del cierre. Al enviarlo después, recibió «Oportunidad no disponible» y no generó comprobante |
| Renovación | Confirmó vigencia hasta **23/11/2026**, volvió a mostrar la oferta y conservó exactamente 1 postulación |
| Estado al terminar | La oferta ficticia volvió a cerrarse. El listado público recuperó sus 5 ofertas y no incluyó el ID de QA |
| Privacidad de la API pública | 5 IDs únicos; sin `owner_access_hash`, `consulta_hash`, claves, contactos, correos, WhatsApp ni `request_id` |

Evidencia del rechazo desde una pantalla desactualizada: [captura sin credenciales](evidence/bolsa-d1-cierre-qa-20261024.jpg). Los correos de esa captura son ficticios. No se incorporan claves privadas, hashes ni respaldos al repositorio.

La oferta cerrada y su única postulación permanecen en D1 como historial de QA. No se borraron registros previos. El KV anterior a la migración ya no representa el estado actual; **no usarlo como reversión directa**.

## Corrección de Pages derivada de la validación

El panel existente retornaba al detectar D1 sin solicitar la descarga del backup. Se corrigió en la rama Pages: descarga el estado D1 actual después de verificar sus registros y credenciales; informa cantidades y origen; bloquea copias desde el KV antiguo. La suite Pages aprobó **68 pruebas**. La descarga autenticada debe verificarse desde la sesión del usuario después del despliegue; el asistente no posee esa sesión.

## Límites y próximos pendientes

- El doble clic comprueba la protección de la interfaz. No sustituye dos solicitudes HTTP independientes simultáneas con el mismo identificador: la concurrencia atómica está probada localmente/CI, todavía no con ese escenario en Cloudflare.
- La prueba de consentimiento anterior es de interfaz; los rechazos del servidor por consentimiento inválido también tienen pruebas locales/CI.
- No se probó el acceso remoto con una clave emitida antes de la migración; no se dispone de un comprobante legado de QA.
- No se hicieron pruebas en un teléfono físico, tablet ni Smart TV en este turno.
- La restauración D1 sigue desactivada. Falta su prueba remota sobre una base desechable y comprobar el backup descargado posterior a estas escrituras.
- Falta completar el vínculo explícito con Mi Perfil/cuenta, la entrega y lectura de avisos, la importación desde Admin y el circuito transaccional de recuperación con proveedor de correo. Los dos endpoints de recuperación continúan deshabilitados.

**Estas pruebas validan el circuito básico D1 en staging. Bolsa todavía no está terminada de punta a punta ni autorizada para producción.**
