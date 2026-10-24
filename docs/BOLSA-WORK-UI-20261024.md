# Bolsa · frontend staging · 24/10/2026

Rama exclusiva `audit/continuidad-demo-20261019`, base `1a58266293e0c10a4be361d17179ffedb3b2aa5e`.
No se copió ni actualizó el Worker de esta rama. Backend independiente en `release/radio-studio-staging-rc-20261020`.

## Cambio

Las postulaciones ahora llevan un UUID de solicitud. El reintento conserva el mismo UUID; cambiar de oportunidad genera otro. Esto permite el índice único del nuevo backend D1. El UUID no es una credencial ni queda guardado en almacenamiento local.

Una respuesta de solicitud ya recibida detiene reenvíos y conserva los campos y el aviso para recuperar el comprobante con soporte. Las claves privadas continúan mostrándose solo en el comprobante y no se agregan a la URL.

## Verificación

Se corrigieron los fixtures antiguos: faltaban consentimiento, opciones de privacidad, contexto de navegación y campos que ya existían en la página; también esperaban moderación previa y fallback a otra API. No se eliminaron comprobaciones de privacidad o doble envío. Se agregaron tres escenarios de identificador persistente de reintento, consentimiento/campos opcionales y bloqueo de solicitud duplicada.

Pruebas: `node --test tests/job-application-ui.test.cjs tests/job-status-contract.test.cjs tests/staging-build.test.mjs`.

Los tests ejercitan los scripts reales con un DOM simulado y verifican el aislamiento del build. **No equivalen a pruebas visuales móviles ni a un circuito de publicación desplegado.**

Se agregó CI `bolsa-ui-staging.yml`, limitado a la rama de pruebas. El Worker publicado seguía en 11757 al registrar el estado remoto; el nuevo almacenamiento D1 no se activó. La recuperación por correo sigue deshabilitada.
