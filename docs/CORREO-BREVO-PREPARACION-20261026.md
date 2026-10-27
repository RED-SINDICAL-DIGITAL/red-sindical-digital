# Correo de acceso y Brevo · estado al27/10/2026UTC

**Actualización26/10Argentina, posterior al informe anterior:** el operador informó `complete` del laboratorio11766-mail-lab-1: siete fases D1 aprobadas, ambas huellas y etiquetas cotejadas. Evidencia `evidence/bolsa-11766-mail-lab-aprobado-20261027.json`. No repetir.11767 integra ese núcleo sin modificarlo únicamente en una QA real privada y prepara el receptor de Pages; rutas generales503, cuenta por correo/Google y restore operativo apagados. El procedimiento actual es `BOLSA-11767-RECUPERACION-REAL-QA.md`. Su despliegue/canje real todavía no se acreditan. Las descripciones de no integración/ensayo pendiente más abajo corresponden al checkpoint previo.

El operador informó **11766 `received`**, scope `brevo-delivery-staging`, `sandbox:false`, aceptación del proveedor y recepción comprobada, a `2026-10-27T00:39:26.248Z` (**26/10,21:39:26Argentina**). Recuperación permanece apagada. Evidencia `evidence/brevo-11766-recepcion-aprobada-20261027.json`. Work cotejó el reporte con el código, sin ejecutar el envío, leer su estado autenticado o comparar el JS remoto. Este resultado acredita el diagnóstico normal informado; no acredita un enlace de recuperación, una cuenta verificada o login.

No repetir dominio/remitente/DNS/APIkey/destinatario/sandbox o correo diagnóstico. El siguiente paso concreto es actualizar **solo `uadav-bolsa-lab`** con `releases/uadav-bolsa-mail-lab-11766.zip` y ejecutar las siete fases sintéticas de `BOLSA-11766-LABORATORIO-RECUPERACION.md`. El Worker principal11766 y sus secretos no cambian.

## Configuración y decisiones vigentes

Cuenta UADAV única, correo privado y Google opcional: `CUENTA-UNICA-Y-ACCESO-SIMPLE-20261026.md`. BrevoFree elegido, cuota compartida300/día según la configuración observada; no es ilimitado ni se contrató un plan pago. Google no está implementado. Los avisos habituales siguen en Mi Perfil; accesos y seguridad tienen prioridad en el presupuesto de correo.

Capturas privadas del26/10 muestran `correo-staging.uadavstream.com.ar` Autentificado, dos CNAME DKIM y dos TXT en DNS only/Auto, personalización opcional vacía. Remitente **UADAV STREAM · pruebas**, `acceso@correo-staging.uadavstream.com.ar`, Verificado, DKIM/DMARC verdes. No se copiaron las capturas al repositorio. Evidencias `evidence/correo-brevo-dominio-autenticado-20261026.json` y `evidence/correo-brevo-remitente-y-secreto-20261026.json`.

`BREVO_API_KEY` y la dirección propia receptora `BREVO_QA_RECIPIENT` fueron configuradas por el operador en staging. Work desconoce sus valores y no leyó binding/permisos autenticados.11765 sandbox accepted y11766 received fueron resultados seguros compartidos por el operador. No enviar secretos, destinatarios o códigos al chat/GitHub/TXT.

## Código y garantías preparadas

- `scripts/access-mail-message.mjs`: tres mensajes, una acción principal, HTML/texto, hora argentina explícita, enlace temporal con token en fragmento, sin claves permanentes o recursos externos. `/acceso-correo.html` sigue siendo un destino reservado: no hay página receptora/canje público.
- `scripts/brevo-request.mjs`: cliente HTTPS fijo, sin redirecciones, respuesta acotada8KiB y plazo5s. En la API principal se usa únicamente para los diagnósticos privados11765/11766, no para emitir accesos.
- `scripts/brevo-recovery-message.mjs` y `scripts/brevo-staging-mail.mjs`: snapshot completo antes de encolar, cifrado por el outbox; destinatario/remitente/asunto/HTML/texto/plazos/UUID inmutables entre despliegues. Una huella vincula el contexto de la clave del proveedor sin guardar la clave. El envío desde outbox exige ese snapshot; no recompone mensajes si falta.
- Sin CC/BCC, adjuntos, campañas, importación de contactos, encabezados arbitrarios, redirecciones de destino o acceso a Gmail. Lista explícita de destinatarios de QA. Cambio de contexto de APIkey bloquea pendientes antes de HTTP; una plantilla nueva no altera sus bytes.
- Solo201 y `messageId` válido registran aceptación. El ID interno es `brevo:<SHA256>`; no se inventan recibos y aceptación no equivale a recepción.

## Respuesta perdida: revisión del diseño

Brevo documenta30min de deduplicación por UUID y `duplicate_parameter` al repetir; no promete devolver el recibo original. La ventana mínima del núcleo sigue siendo935000ms (TTL15min+lease30s+plazo5s). Nunca se extiende la validez ni se vuelve a enviar una intención vencida.

El diseño preparatorio anterior activaba el token solo con recibo. Quedó reemplazado: **la persona que posee el enlace recibido puede canjear su token aleatorio de256bits**, después de una reserva de despacho y dentro del plazo/revisiones actuales, aunque falte la respuestaAPI. El recibo sigue siendo auditoría; un error de duplicado no se convierte en éxito. La credencial/vínculo previos se conservan hasta ese canje válido. Un único lote D1 consume el token, rota acceso y revoca el vínculo previo; una respuesta perdida del canje se reconcilia solo para la misma credencial nueva.

La revisión y sus pruebas están en `BOLSA-CORREO-NUCLEO-TRANSACCIONAL-20261026.md`. **No está integrada en el Worker principal.** Se preparó únicamente el laboratorio separado para probarla en D1 remoto con datos ficticios y cero mensajes reales.

## Pruebas y trabajo restante

Preparación previa:122gruposNode/20workerd;11765:146/21;11766 diagnóstico:170/22 y12Radio, CI Bolsa40426233321/Radio40426233264 success para96cf98a5db6de17b7d3e097a885bf7ee5599b826. Son evidencias de código, separadas de los reportes remotos del operador.

Revisión nueva:197grupos focalizados aprobaron juntos antes del último caso adicional;32del núcleo actualizado, seis snapshot,17transporte y13laboratorio se verifican en sus archivos.23controles workerd aprobados; CI registra el total final. Red simulada/SQLite local y DOM no prueban recepción/canje real, D1 remoto nuevo o dispositivos físicos. MainWorker11766 y artefactos anteriores byte a byte sin cambios.

Faltan: siete fases del nuevo laboratorio D1, endpoints/receptor seguros, identidad de abuso derivada del servidor y antienumeración temporal, cuotas globales/prioridades, emisión/sesiones/identidades de cuenta y Google, migración voluntaria sin fusión por correo, exportación/restauración/retención/rotación de claves, QA de recuperación real y dispositivos. Mantener ambos endpoints públicos503 y restore operativo deshabilitado.

Fuentes primarias consultadas: [API Brevo](https://developers.brevo.com/reference/send-transac-email), [idempotencia Brevo](https://developers.brevo.com/docs/heterogenous-versions-batch-emails), [sandbox](https://developers.brevo.com/docs/using-sandbox-mode), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [Google backend](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).


Código y artefactos guardados en `e4035e2f0ad1f82b630464c1c04a39654a701447`, árbol `62d7082eb1d8a668d5f47ca577ccb8daaa2ede1d`,24blobs cotejados por SHA. CI [Bolsa40434894253](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40434894253) y [Radio40434894235](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40434894235) `completed/success` para ese commit, con todos sus pasos aprobados. La suite focalizada actual contiene198casos (197previos+el nuevo caso de bandeja privada); se verificó el éxito del paso CI, sin obtener su log numérico. Evidencia `evidence/bolsa-11766-mail-lab-ci-y-entrega-20261027.json`. No equivale a despliegue o ejecución D1 remota del laboratorio nuevo. No repetir pruebas por este registro documental.
