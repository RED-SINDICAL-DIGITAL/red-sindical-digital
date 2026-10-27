# Bolsa11766 · laboratorio de recuperación · solo datos ficticios

**Preparado y probado localmente; sin despliegue remoto desde Work.** La recepción real del diagnóstico11766 ya fue informada como aprobada por el operador. No volver a desplegar el Worker principal, configurar Brevo o enviar otro correo diagnóstico para este paso.

Esta entrega usa el **Worker `uadav-bolsa-lab` y su base/clave existentes**. Conserva el historial de las ocho pruebas anteriores y agrega siete fases del nuevo núcleo transaccional. No requiere crear otro Worker, base, clave, cron o binding, ni ejecutar SQL a mano. Solo acepta el hostname HTTPS exacto del laboratorio; rechaza staging operativo, restore QA y producción antes de leer sus bindings.

## Pasos concretos

1. Descargar `releases/uadav-bolsa-mail-lab-11766.zip` de este commit y extraer **worker.js**. Alternativa: copiar el contenido de `releases/uadav-bolsa-mail-lab-11766.js`. No usar el `worker.js` de la raíz: corresponde a la API principal.
2. Cloudflare → **Workers & Pages → uadav-bolsa-lab → Edit code**. Reemplazar el código por ese archivo y pulsar **Deploy**. Conservar `DB`, `QA_BOLSA_KEY` y `QA_BOLSA_ONLY=true` existentes. No añadir `BREVO_API_KEY`, destinatarios o variables de producción.
3. Abrir [el laboratorio de Bolsa](https://uadav-bolsa-lab.uadavstream.workers.dev/). Entrar con **la misma clave del laboratorio de Bolsa**. No es la clave Admin ni la de Brevo. Entrar/consultar no ejecuta pruebas.
4. Marcar **Autorizo estas pruebas con datos ficticios en la base del laboratorio de Bolsa ya aprobado** y pulsar **Ejecutar pruebas de recuperación**. El botón ejecuta las siete fases nuevas; no hace falta repetir las ocho anteriores. Las tablas de prueba se instalan únicamente después de esa acción y de verificar la identidad/huella de la base sintética aprobada.
5. Al terminar, pulsar **Copiar resultado seguro** y compartir solamente ese JSON. Finalizar con **Salir**. No pegar claves o enlaces de acceso en el chat.

Si una respuesta tarda, usar **Consultar estado** o volver a entrar antes de reintentar. Una fase registrada como completa se consulta sin repetir sus operaciones. Un error de base ajena, esquema previo incompatible o huella diferente exige conservar el resultado para revisión; **no borrar tablas, cambiar bindings o crear otra base para forzar la prueba**. No hay una función de reset en esta entrega.

## Resultado esperado

Versión `11766-mail-lab-1`, scope `isolated-synthetic-mail-recovery`, resultado `complete`, `emails_sent:0`, `recovery_enabled:false` y siete comprobaciones:

1. Solicitud cifrada y mensaje inmutable.
2. Respuesta perdida y enlace recibido.
3. Canje concurrente: una sola credencial.
4. Rollback y respuesta perdida del canje.
5. Cambios de contacto, revocación y vencimiento.
6. Reintentos idénticos y cambio de clave del proveedor.
7. Integridad final y aislamiento del laboratorio.

El reporte contiene sus etiquetas con `: aprobado`. Las dos solicitudes de la fase3 compiten por un único canje D1; cada petición tiene presupuesto conservador de48 sentencias. Todo transporte de correo está interceptado dentro del laboratorio con direcciones `.invalid` y respuestas sintéticas. No lee secretos de Brevo ni contacta al proveedor. No cambia fechas, oferta/candidatura de la QA de vencimiento o reloj global.

## Artefactos comprobados

| Elemento | Valor |
|---|---|
| Worker del laboratorio | 745835bytes; SHA256 `12ae0b57e88c90cd0dd4676d5cf7bb02e322dada6b8282239666a5ca21a92a86` |
| ZIP, `worker.js` cotejado al extraer | 186331bytes; SHA256 `bdd3967e9dcd4a07845177691421cfa75f10ac360ff93938d8772bf378a180ca` |
| Base congelada11764 | `d4392464cf5b3c731fe49fe800ab1a3dedb37af1e1a584c11c98639382534013` |
| Módulos/SQL/HTML del nuevo ensayo | `6ff12d37d0043eecfe4c27b7621270478db76b7d1b6b919b4924ca2709d59d37` |

Los13 grupos Node/SQLite del laboratorio aprobaron localmente, incluidos protección de base ajena, DDL atómico frente a cambios concurrentes, preservación del historial previo, canje paralelo, respuestas perdidas, presupuesto por petición y cinco casos DOM de consentimiento/sesión/reporte. Los23 controles workerd incluyen carga del archivo autónomo y rechazo de hosts operativos. No se completó revisión visual ni pruebas en dispositivos físicos. CI y commit se detallan al final de esta guía.

El Worker principal11766, sus ZIP previos, Pages, cron y producción permanecen idénticos. Incluso si este laboratorio aprueba, **la recuperación pública sigue deshabilitada**. Restan receptor HTTP/UI, abuso/cuotas, cuenta/correo verificado, respaldo/retención/rotación y un ensayo real completo de recuperación antes de activarla. Bolsa conserva además sus otros bloques de cierre. Ver `BOLSA-CORREO-NUCLEO-TRANSACCIONAL-20261026.md` y `BOLSA-ESTADO-Y-CIERRE-20261025.md`.


Código y artefactos guardados en `e4035e2f0ad1f82b630464c1c04a39654a701447`, árbol `62d7082eb1d8a668d5f47ca577ccb8daaa2ede1d`,24blobs cotejados por SHA. CI [Bolsa40434894253](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40434894253) y [Radio40434894235](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40434894235) `completed/success` para ese commit, con todos sus pasos aprobados. La suite focalizada actual contiene198casos (197previos+el nuevo caso de bandeja privada); se verificó el éxito del paso CI, sin obtener su log numérico. Evidencia `evidence/bolsa-11766-mail-lab-ci-y-entrega-20261027.json`. No equivale a despliegue o ejecución D1 remota del laboratorio nuevo. No repetir pruebas por este registro documental.
