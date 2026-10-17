# Confirmación segura de eliminación — 17/10/2026

Se conserva la distinción entre desvincular un artista, eliminar su perfil y eliminar la cuenta personal. La eliminación sigue exigiendo escribir ELIMINAR y validar disponibilidad del backend antes de enviar la operación.

El diálogo activo no puede reemplazarse mientras procesa una operación. Se impiden envíos duplicados. Antes y después de comprobar el backend se verifica que la confirmación siga abierta y corresponda a la misma cuenta. La renovación del token del artista se comprueba antes de enviar DELETE. Una respuesta tardía de eliminación no limpia el acceso local ni ejecuta el callback de una cuenta distinta. Tras fallo se conserva la confirmación escrita y se restablecen los controles para reintentar.

Ocho regresiones en tests/profile-removal-dialog.test.cjs: duplicación/reemplazo de diálogo ocupado, cambio de cuenta durante health, cierre del diálogo, fallo y reintento, cambio de cuenta durante renovación, eliminación válida con id/token exactos, ausencia de confirmación escrita y respuesta tardía tras cambio de cuenta. Sólo simulaciones del módulo en VM; no se borraron perfiles ni cuentas remotos.

GitHub Actions 39076513282 sobre 4f540284d828acea7b297316967812f8025c77ae: los pasos Profile removal confirmation isolation, Account recovery and deletion lifecycle y Artist account client through isolated Worker terminaron satisfactoriamente. La ejecución global de Platform integration checks también terminó satisfactoriamente. El entorno local y navegador no estaban disponibles. La entrega de la referencia 20261017-removal-safe y la prueba visual siguen pendientes. Producción y pagos sin cambios.
