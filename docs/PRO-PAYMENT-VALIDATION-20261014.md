# PRO y pagos — validación aislada 14/10/2026

Se ejecutaron satisfactoriamente contra el Worker real y SQLite aislado: pro-payment-fulfillment.mjs, pro-bank-confirmation.mjs, artist-pro-integration.mjs y presskit-publication-privacy.mjs.

Cobertura: comprobante no equivale a acreditación, denegación sin adaptador, aprobación concurrente única, renovación sin duplicación, cupos mensual/anual 1/12, validación de titularidad actual, denegación de firma falsa o vencida y monto/moneda/destino/estado incorrectos, unicidad de transacción, recuperación tras interrupción KV sin extender otra vez PRO. Restricciones free, lectura tras vencimiento, bloqueos de edición y revisión optimista también pasan. Press Kit público excluye presupuestos, agenda, seguimientos y campos ocultos; borrador/revisión conservan la versión pública anterior; retirar publicación conserva datos privados.

Interfaz: Mi PRO agrega Actualizar estado, vuelve a consultar el plan y actualiza sus permisos visuales sin enlaces nuevos. Pedidos pendientes o rechazados no se muestran con estilo de éxito. Se distingue rechazo del pedido de devolución bancaria. No se inventa duración si el pedido no la informa. Sintaxis y 11 pruebas de acceso/sesión pasan. Falta verificar esta última interfaz desplegada y con un pedido de prueba confirmado.

Límite: pruebas locales de integración con adaptador firmado sintético; ningún banco real conectado, ninguna transferencia ni cobro realizado. No se verifica una imagen de comprobante como acreditación. Para automatización real falta elegir/configurar fuente bancaria confiable y probarla en staging. No se habilitaron cobros ni se modificó producción o Worker desplegado.

## Verificación posterior en navegador

Se abrió Mi PRO de PRUEBA VISUAL QA 2235 en staging y se pulsó Actualizar estado. La consulta terminó, conservó el plan Gratis y el artista correcto, y rehabilitó el botón. La pantalla informa cobro PRO no habilitado y mantiene Elegir mi PRO deshabilitado. Esto no prueba activación bancaria ni renovación de un pedido real. Se agregaron tres pruebas de regresión al archivo artist-manage-api.test.cjs: actualización del plan actual sin crear orden, respuesta tardía tras navegación ignorada, error conserva plan y permite reintentar; las siete pruebas del archivo pasan.
