# Mi perfil y mensajes — 11748 / 12043

Configuración agrupa dispositivos, foto, intereses, eliminación y recuperación. Los controles existentes mantienen sus identificadores y permisos.

Admin → Mensajes a usuarios: texto para todas las cuentas o ID de cuenta seleccionado. Vigencia de 1 a 90 días. Retirar elimina el aviso. La campana muestra sólo mensajes generales y los de la cuenta autenticada; leído se sincroniza entre dispositivos. Los mensajes no se envían fuera de la aplicación.

El shell consulta version.json al abrir, recuperar foco y cada cinco minutos. Ofrece actualizar o posponer; no fuerza recarga. Una versión futura debe incrementar build en version.json y en uadav-update-v149.js. No se implementó Web Push ni instalación PWA en este cambio.

Desplegar Worker 11748 para mensajes. No se publicó ningún mensaje real a usuarios durante las pruebas.
