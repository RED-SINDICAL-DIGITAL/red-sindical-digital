# Bolsa 11763 · entrega guardada y verificación

## Actualización posterior al despliegue · 26/10/2026

Health ya confirmó **11763**, D1/KV detectados y correo/cola apagados. Falta el ingreso Admin confirmado y la lectura del estado privado; el canal browserAuth terminó sin resultado. Ver `BOLSA-11763-DESPLIEGUE-VERIFICADO-20261026.md`. No repetir el despliegue ni configurar el cron antes de esa comprobación.

## Resultado de la entrega original

**Código y pruebas aprobados; Worker 11763 pendiente de despliegue manual.** No se configuró ningún flag o trigger remoto. El Worker observado después de la entrega seguía en **11762**, con D1/KV disponibles, correo y cola apagados. Marca temporal literal de health: `2026-10-26T07:08:49.687Z`.

La interfaz y la guía pública se publicaron desde la rama Pages. Se observó en el DOM de Admin el recurso `/uadav-jobs-expiry-admin.js?v=11763.1`; el manual publicado incluyó la aclaración de que el vencimiento bloquea postulaciones aunque no se haya generado el aviso. [Evidencia de la guía](evidence/bolsa-11763-guia-publicada.jpg).

El navegador perdió las pestañas y la sesión anteriores. Se solicitó un único reingreso mediante browserAuth, sin leer ni registrar la clave; la operación no devolvió confirmación. La comprobación posterior en una pestaña nueva mostró el acceso administrativo. **No se acredita una sesión Admin activa ni la revisión privada del nuevo panel en este paso.** Tampoco se atribuye el fallo a una clave incorrecta o bloqueo anti-bot. No se repitió el ingreso ni se cambió una credencial para forzarlo.

## Commits y CI

| Rama | Código guardado | Verificación |
|---|---|---|
| Worker staging | `90df7e3c6561271fa6a185f664cc17816c28266c` | [Bolsa 40263069135](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40263069135): success; [Radio 40263069094](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40263069094): success. |
| Pages staging | `cfc19c838c99be50820a81f7b6a4ca6d8f5464cd` | [Bolsa UI 40263077171](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40263077171): success. |

Se aprobaron localmente 73 pruebas Worker, 138 UI, 15 comprobaciones workerd y 12 estáticas de Radio Studio; compatibilidad KV e importación/exportación Admin también aprobadas. Estas pruebas no reemplazan el ensayo de la ejecución programada en D1 remoto. Los archivos del adaptador QA 11762 aprobado se conservaron sin cambios.

## Descargas permanentes

- [ZIP del Worker principal staging 11763](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/raw/90df7e3c6561271fa6a185f664cc17816c28266c/releases%2Fuadav-api-staging-11763.zip).
- [Código completo para copiar](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/blob/90df7e3c6561271fa6a185f664cc17816c28266c/worker.js).
- [Guía de despliegue por etapas](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/blob/90df7e3c6561271fa6a185f664cc17816c28266c/docs%2FBOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md).

SHA256 de `worker.js`: `50d232f8b6e90cb54f266299b81d25c0a94af3c93687983f4389a9b0c1a0f348`.
SHA256 del ZIP: `002eb47cf583876983d1c3129649d46df6502430aed04220664a3e6409604640`.

## Continuación exacta

Desplegar el ZIP **solo en uadav-api-staging**, conservando DB, KV y secretos existentes. No ejecutarlo en `uadav-restore-qa`, no aplicar SQL ni tocar producción. Primero verificar health **11763** y luego el GET privado de estado desde Admin mediante ingreso seguro. El código queda apagado por defecto.

Solo después de verificar esa versión podrá prepararse el flag y cron de la segunda etapa. No agregar un cron sobre 11762: su programador compartido todavía ejecuta otros módulos. Falta el primer evento real, el vencimiento con reloj real y su aviso privado repetido sin duplicados. La recuperación por correo continúa deshabilitada y Bolsa aún no está completa.
