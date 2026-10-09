# Recuperación de acceso y navegación · 12032

Frontend, sin Worker nuevo. Unifica el módulo de acceso en Mi perfil, gestión del artista y herramientas PRO.

Si existe una cuenta vinculada con artistas autorizados, recupera la sesión del artista desde esa cuenta en lugar de priorizar un token local viejo. La selección guardada solo se reutiliza si sigue en la lista autorizada. Un artist_id solicitado que no pertenece a la cuenta no da acceso. Un permiso de cuenta no se convierte en permiso independiente al desconectar el navegador.

Mi perfil vuelve a consultar al recuperar foco, cambiar credenciales o recibir cambios de almacenamiento. Las respuestas antiguas no reemplazan la pantalla tras cambiar de cuenta. Los accesos a herramientas y consultas generan primero la sesión correspondiente. Los errores ofrecen reintento y rutas de recuperación.

InPrivate, otro navegador u otro dominio tienen almacenamiento independiente: necesitan vincularse con QR/código a la misma cuenta. No se copian tokens de artista dentro de la biblioteca sincronizada. Se conservan las verificaciones de propietario, vencimiento y revocación del servidor.

El menú Más opciones se presenta por encima de las pestañas. Al abrirlo se elimina el escalado del fondo que podía extenderse horizontalmente. El shell actualiza su ruta cuando la página interna navega y elimina tokens de artista de esa ruta visible.

Pruebas: recuperación con token antiguo, selección revocada, artista no vinculado, aislamiento de permisos; flujos reales con SQLite para vinculación de artistas, dos dispositivos, revocación y recuperación. Falta comprobación con la cuenta y los navegadores reales del usuario; no se conoce el estado privado de la ventana de la captura.
