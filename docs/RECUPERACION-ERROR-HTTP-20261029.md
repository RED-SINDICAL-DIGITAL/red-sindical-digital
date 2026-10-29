# Diagnóstico de canje y estados HTTP — 29/10/2026

El operador confirmó recepción del nuevo correo en Spam. La captura y el reintento muestran error genérico; NO se certifica recuperación ni causa del incidente.

Se encontró y corrigió un defecto reproducible: el controlador HTTP consultaba `error.status`, pero los controles del runtime usan `error.liveStatus`. Por ello un enlace inválido/vencido (400) o un límite (429) se presentaban como 503 y el receptor invitaba a reintentar indefinidamente.

Ahora ambos contratos conservan 400 y 429; el resto permanece como 503 genérico sin revelar diagnóstico privado. No se amplía vigencia, no se reinicia una reserva y no se habilitan ofertas reales.

444 pruebas Worker aprobadas. Nuevo caso cubre siete combinaciones de estado y ausencia de datos internos en respuesta. Incluye correcciones anteriores de envío acotado y vencimiento exacto.

Desplegar únicamente el candidato `releases/worker-UADAVSTREAM-V11.7-11770-recovery-errors.js` en `uadav-api-staging`, sin cambios de variables ni migraciones. No desplegado por esta sesión. Producción intacta.

Pendiente: consultar diagnóstico privado de la prueba actual, determinar si venció o existe fallo transaccional/configuración, y completar una nueva prueba solo si corresponde. No reenviar automáticamente. Spam requiere revisión independiente de autenticación y reputación; no se atribuye su causa sin encabezados/diagnóstico del proveedor.

SHA256: `e17cf3025eb2a9e93eae4acf5b1e2148bb0ffa55b7890a8feb8ce8bf6c3e6983`.
