# Bolsa 11763 · despliegue y Admin verificados · 26/10/2026

## Confirmado en staging

El usuario informó **desplegado**. El navegador abrió `https://uadav-api-staging.uadavstream.workers.dev/api/health` y observó **11763**, `ok:true`, `success:true`, bindings D1/KV detectados, correo y cola apagados. La marca del servicio fue `2026-10-26T15:48:31.957Z` (**12:48 de Argentina**).

El código entregado corresponde a `90df7e3c6561271fa6a185f664cc17816c28266c`, SHA256 `50d232f8b6e90cb54f266299b81d25c0a94af3c93687983f4389a9b0c1a0f348`. Health confirma el build, no una comparación byte por byte del archivo desplegado ni todas las operaciones con D1. El código ya cuenta con 73 pruebas Worker, 138 UI, 15 comprobaciones workerd y 12 estáticas de Radio aprobadas; no se repitieron suites por cambios solo documentales.

Una navegación sin credenciales a `/api/admin/jobs/cron` mostró **No autorizado**. No entregó el estado privado ni datos de ofertas/cuentas. No se añadió una ruta de ejecución pública ni se intentó ejecutar el cron desde HTTP.

## Ingreso seguro y consulta privada aprobados

El primer intento de ingreso terminó por timeout, sin resultado conocido. Se ofreció control manual de la pestaña de Work. El usuario informó que no podía usar ese acceso y pidió volver al cuadro dentro del chat, además de consultar si podía adjuntar un TXT. Esa petición explícita habilitó un nuevo intento seguro; no se recibió ni leyó una clave por chat o archivo.

Se inspeccionó el formulario existente y se utilizó browserAuth. Esta vez devolvió **submitted**. La observación posterior mostró **Administrador / Sesión central**, Auditoría y el banner de staging. Se pulsó únicamente **Actualizar estado automático**, que consulta mediante GET. La pantalla confirmó:

> La revisión automática está desactivada. Todavía no hay una ejecución confirmada.

El mensaje se observó tanto al montar el panel como después de la actualización explícita. Conforme al formateador publicado 11763.1, esa combinación corresponde a base preparada, mantenimiento sin pausa, automatización desactivada y ningún turno confirmado, en curso o interrumpido. Esta interpretación se basa en la interfaz y su contrato; no se extrajo el JSON privado, la clave ni el almacenamiento del navegador. La captura se guardó a las **13:52 de Argentina**, `2026-10-26T16:52:16.986Z`.

[Evidencia de Admin autenticado](evidence/bolsa-11763-admin-autenticado-20261026.jpg). [Registro estructurado de observación](evidence/bolsa-11763-despliegue-20261026.json). La [pantalla anterior que requería ingreso](evidence/bolsa-11763-admin-ingreso-manual-20261026.jpg) se conserva como evidencia histórica.

## Continuación necesaria

El bloqueo de ingreso quedó resuelto. No pedir otro despliegue de 11763 ni otro acceso mientras la sesión siga válida. Ya puede continuarse la **etapa 2** de `BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md`: configurar manualmente, solo en **uadav-api-staging**, `JOB_STAGING_CRON=bolsa-only` y el trigger exacto `*/15 * * * *`, conservando los demás ajustes de staging. La configuración del trigger en Cloudflare aún no se observó; el estado desactivado no demuestra su ausencia.

Después corresponde verificar un evento real y su recibo privado. No se activó ninguna variable o trigger desde estas sesiones ni se enviaron avisos. El vencimiento con reloj real, aviso posterior y repetición sin duplicados continúan pendientes.

Producción no se operó. El Worker de restauración QA aprobado y el respaldo privado no se tocaron. La recuperación por correo y la restauración operativa siguen deshabilitadas. Bolsa todavía no está completa.
