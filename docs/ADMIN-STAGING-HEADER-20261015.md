# Cabecera del Admin en staging — 15/10/2026

La captura autenticada anterior mostraba el aviso PRUEBAS superpuesto a la cabecera fija y al inicio de la barra lateral. Se agregó desplazamiento top de 24px para .sidebar y .topbar, y altura lateral ajustada a 100dvh menos 24px. Reglas exclusivas de .uadav-staging-top body[data-page=admin], generadas por el build de staging. No afecta el CSS de producción ni páginas embebidas.

Las cinco pruebas de staging-build.test.mjs pasan. Falta verificación visual autenticada después del despliegue; el navegador de esta mañana no conserva la sesión administrativa de anoche y muestra login. No se atribuye a un vencimiento del backend. No se volvió a solicitar la clave todavía para continuar tareas de código sin bloquear al usuario.

Prioridad pendiente: sesión artista vinculada + PRO de prueba + edición/publicación/revisión de Press Kit; pago de prueba verificado con propiedad correcta; reproducción simultánea y pruebas físicas móvil/tablet/TV. Moderación en staging sigue sin claves de proveedor. Producción no fue modificada.
