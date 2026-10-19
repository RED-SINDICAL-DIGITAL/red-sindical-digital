# Revisión directa de moderación — 17/10/2026

Revisar contenido desde Pendientes lleva a Moderación y enfoca el envío exacto por id. Se desplaza a la tarjeta, aplica contorno visible y foco de teclado. Una selección posterior limpia el resaltado anterior. Si el envío dejó de estar pendiente, se informa sin seleccionar otro. Se conserva compatibilidad con Admin anterior mediante navegación genérica.

La carga de moderación comprueba que sus contenedores sigan formando parte de la sección actual. Cargas y errores tardíos no añaden contenido sobre otra pantalla. Cambios en uadav-community-admin-v144.js, uadav-pending-admin-v146.js y admin.html; recursos con referencia 20261017-moderation-focus.

Validación: 74 pruebas locales satisfactorias en el conjunto de Admin; incluye nueve nuevas de selección exacta, selección posterior, carga/error obsoletos, acceso directo, envío ausente, navegación fuera y compatibilidad. GitHub Actions sobre ace7639dc53b55fc8f69b66866ae501ccd616174: Platform integration checks 39086602693 y Job status contract checks 39086602686 satisfactorios.

Chrome de staging: sesión de Admin recuperada mediante formulario seguro; recarga conserva acceso. Pendientes muestra 14; filtro Moderación muestra 3. Revisar contenido sobre QA BORRADOR 0a7bff0360db, versión 2, enfoca y resalta MOD-5652699a-c5a9-46e5-a158-3eea3cdf488d. Comprobado con DOM y captura. No se aprobaron ni rechazaron envíos. La configuración visible continúa activada pero sin proveedor Gemini/Groq con clave; la IA no está operativa y mantiene revisión manual. No se cambió esa configuración.

Producción, pagos, permisos y datos sin cambios. La prueba de propietario de artista y vinculación privada continúa pendiente por el bloqueo anterior del formulario de asociación de dispositivo. La nueva autenticación de Admin es un ingreso ordinario distinto y no modifica ese bloqueo. Faltan pruebas físicas de móvil/tablet/TV.
