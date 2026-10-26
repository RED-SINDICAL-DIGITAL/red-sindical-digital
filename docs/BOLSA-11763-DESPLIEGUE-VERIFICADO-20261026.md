# Bolsa 11763 · despliegue verificado · 26/10/2026

## Confirmado en staging

El usuario informó **desplegado**. El navegador abrió `https://uadav-api-staging.uadavstream.workers.dev/api/health` y observó **11763**, `ok:true`, `success:true`, bindings D1/KV detectados, correo y cola apagados. La marca del servicio fue `2026-10-26T15:48:31.957Z` (**12:48 de Argentina**).

El código entregado corresponde a `90df7e3c6561271fa6a185f664cc17816c28266c`, SHA256 `50d232f8b6e90cb54f266299b81d25c0a94af3c93687983f4389a9b0c1a0f348`. Health confirma el build, no una comparación byte por byte del archivo desplegado ni todas las operaciones con D1. El código ya cuenta con 73 pruebas Worker, 138 UI, 15 comprobaciones workerd y 12 estáticas de Radio aprobadas; no se repitieron suites por cambios solo documentales.

Una navegación sin credenciales a `/api/admin/jobs/cron` mostró **No autorizado**. No entregó el estado privado ni datos de ofertas/cuentas. No se añadió una ruta de ejecución pública ni se intentó ejecutar el cron desde HTTP.

## Bloqueo concreto de la verificación privada

Admin solicitó reingreso. Se inspeccionó el formulario y se emitió una única solicitud browserAuth con el campo visible de clave y el botón de acceso. La llamada no devolvió un resultado y terminó por timeout; no se puede inferir si hubo entrada de datos. Después el contexto del navegador se perdió y la primera recuperación abrió una pestaña nueva en la URL canónica de Admin. Allí se observó **Acceso administrativo**, **API disponible** y el banner de staging.

No se observó un rechazo de contraseña ni una protección anti-bot. No se leyó o registró la clave, no se cambió una credencial ni se creó una cuenta. **El ingreso autenticado y el estado de la automatización siguen sin comprobar.** No se activó un flag o trigger desde esta sesión y no debe suponerse el valor real de `JOB_STAGING_CRON` solo por su valor por defecto en el código.

[Evidencia de la pantalla que requiere ingreso](evidence/bolsa-11763-admin-ingreso-manual-20261026.jpg). [Registro estructurado de observación](evidence/bolsa-11763-despliegue-20261026.json).

## Continuación necesaria

Facilitar control manual de **esa pestaña de Work**, con motivo autenticación, para que el usuario ingrese la clave habitual de **Admin staging**. La sesión debe quedar en Auditoría para que Work retome la consulta; no se transfiere una sesión desde el navegador personal ni se pide la clave en el chat. No emitir otra solicitud automática del mismo tipo para este bloqueo.

Después del ingreso, consultar **Avisos por vencimiento de ofertas → Actualizar estado automático**. Validar preparación, mantenimiento, habilitación y último resultado; el botón solo lee información. Aún no se autoriza como resultado aprobado una ejecución programada real. Mantener pendiente la configuración de la etapa 2 hasta comprobar ese estado. No repetir el despliegue si health sigue en 11763.

Producción no se operó. El Worker de restauración QA aprobado y el respaldo privado no se tocaron. El vencimiento con reloj real, aviso posterior, primera ejecución de cron y las otras puertas de cierre de Bolsa continúan pendientes.
