# Presentación de staging y navegación — 15/10 UTC

La captura del perfil privado mostraba dos avisos amarillos: documento app y página embebida. Se ajustó stagingRuntime para añadir aviso y espacio superior solamente al documento superior. Una página de staging abierta sola conserva el aviso. No cambia la protección de solicitudes, CSP, noindex ni destinos API. Cinco pruebas de staging-build.test.mjs pasan, incluida la nueva prueba documento superior/embebido. Falta inspección visual tras despliegue.

Hallazgo separado: cambiar de pestaña dentro del editor modifica su URL interna, pero no la URL view de app. Al recargar, app puede volver a la pestaña indicada originalmente. Pendiente revisar integración del historial con el shell; no se ha corregido todavía, para evitar duplicar navegación o interrumpir reproducción persistente.

Producción y Worker sin cambios.

## Corrección de sincronización preparada

Se implementó syncArtistTab en app y el aviso uadav:artist-tab al cambiar pestañas de gestionar-artista y mi-espacio-artista. App valida event.source contra el iframe activo y obtiene la URL real del frame; solo admite las dos páginas de artista, mismo origen, y copia exclusivamente artist_id y tab. Reemplaza el historial del shell sin invocar nav, recargar el frame ni cambiar el modo del reproductor. Mantiene build y demás estado del shell. No crea una entrada Atrás por pestaña: esta corrección se limita a conservar pestaña en recarga.

Cuatro pruebas nuevas pasan: sincronización y exclusión de token/rev, rechazo de otra ventana, rechazo de origen/página ajenos y conservación del artista en herramientas. También pasan 14 pruebas de gestión y sesiones y la sintaxis de las tres páginas. Se incorporó a CI. Pendiente verificar el cambio desplegado, recargar tras seleccionar Consultas y repetir en herramientas. Reproducción simultánea no se comprobó en navegador.
