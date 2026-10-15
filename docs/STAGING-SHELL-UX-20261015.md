# Presentación de staging y navegación — 15/10 UTC

La captura del perfil privado mostraba dos avisos amarillos: documento app y página embebida. Se ajustó stagingRuntime para añadir aviso y espacio superior solamente al documento superior. Una página de staging abierta sola conserva el aviso. No cambia la protección de solicitudes, CSP, noindex ni destinos API. Cinco pruebas de staging-build.test.mjs pasan, incluida la nueva prueba documento superior/embebido. Falta inspección visual tras despliegue.

Hallazgo separado: cambiar de pestaña dentro del editor modifica su URL interna, pero no la URL view de app. Al recargar, app puede volver a la pestaña indicada originalmente. Pendiente revisar integración del historial con el shell; no se ha corregido todavía, para evitar duplicar navegación o interrumpir reproducción persistente.

Producción y Worker sin cambios.
