# UADAV STREAM · Perfil simple · Worker 11744 / web 12039

## Recorrido único
Mi perfil → Soy artista → Buscar nombre → Crear perfil o solicitar gestionar uno existente.

- Se entra con la cuenta existente. Para otro equipo se usa QR/código y aprobación del equipo original. No se crea automáticamente una cuenta diferente.
- Crear un perfil nuevo permite editar inmediatamente un borrador privado. Nombre artístico, actividad libre, ciudad y email de contacto. Foto, descripción y enlaces se completan luego desde el editor. YouTube es opcional.
- El borrador no se publica automáticamente: su publicación queda en revisión. La propiedad del borrador no equivale a identidad pública verificada.
- Reclamar un perfil existente requiere revisar el derecho a gestionarlo. Pagar PRO no verifica identidad.
- La solicitud queda asociada a la cuenta autenticada. El estado se ve en Mi perfil desde los dispositivos de esa cuenta.
- Al aprobar una solicitud, el vínculo se crea automáticamente. No hay que enviar ni pegar un enlace en el recorrido habitual.

## Mi artista
Cuatro entradas principales: Editar perfil, Consultas, Mis herramientas, Mi PRO. El enlace público y compartir aparecen cuando el perfil está publicado. Los borradores se identifican como privados. Recuperar un acceso anterior queda como respaldo plegado.

Mis herramientas incluye la presentación profesional compartible/imprimible, espectáculos, presupuestos, agenda y consultas. Se preserva la información guardada y los controles de revisión y publicación.

## Admin
Tres entradas principales en Artistas: Perfiles, Solicitudes y PRO/estadísticas. Descubrimientos, solicitudes anteriores, contenido y propietarios siguen disponibles en Más opciones. No se borraron datos ni controles de recuperación o transferencia de propiedad.

La aprobación indica si el artista ya quedó asociado a su cuenta. El acceso privado queda bajo Enlace de recuperación. Las solicitudes anteriores anónimas conservan su recuperación manual, porque no se puede deducir una cuenta sólo por el email.

## Sincronización
Crear cuenta deja la cuenta lista; no abre un QR innecesario. Vincular otro dispositivo es una acción aparte. Se impide crear otra cuenta sobre una cuenta ya abierta.

Los cambios del perfil avisan Guardando y solicitan guardado en breve. El polling existente sigue actualizando favoritos, historial y demás datos. Si se edita durante una respuesta, se conserva esa edición y se solicita otro guardado. Sin conexión se conserva lo local y se reintenta al volver. No se implementó sincronización con la aplicación cerrada.

Los cambios del nombre, foto y demás campos del perfil se combinan por campo: modificar el nombre en PC y la foto en móvil no genera un conflicto. Si cambia el mismo campo, la elección conserva los otros cambios compatibles.

Se fija la credencial durante cada sincronización. Si se cambia de cuenta o se cierra el acceso durante la carga, la respuesta anterior no se aplica a la nueva cuenta. Cerrar cuenta cancela también un ingreso que todavía estaba pendiente.

## Datos y seguridad
D1 agrega audience_artist_claims, que relaciona la cuenta autenticada con la solicitud. El account_id enviado por el navegador nunca decide la asociación. Conocer un email no permite apropiarse de la solicitud de otra cuenta.

Para borradores nuevos se registran propiedad y vínculo junto con la solicitud, en una transacción. El permiso inicial se identifica como draft_creation. Rechazar ese borrador revoca sus permisos. La aprobación actualiza la verificación de su propietario.

Para reclamos existentes, la aprobación crea el vínculo sólo si coincide con el propietario vigente. La lectura puede completar una asociación que falló después de aprobar. Una desvinculación explícita queda registrada y no se deshace con esa recuperación automática. Revocaciones y transferencias siguen quitando los permisos correspondientes.

Se rechazan enlaces de evidencia fuera de http/https. Los detalles privados de las solicitudes no se muestran a otras cuentas. Los backups incluyen la nueva relación de solicitudes.

## Qué sigue pendiente
La confirmación bancaria automática real sigue requiriendo conectar una fuente confiable de movimientos. El receptor firmado está preparado, pero no existe una integración bancaria operativa por tener alias/CVU. Informar una transferencia no acredita el ingreso.

La verificación de propiedad de un perfil existente continúa siendo una tarea de revisión: la IA de moderación de textos no la sustituye.

## Verificación
SQLite real: creación privada inmediata, seguimiento de solicitudes, aprobación con asociación automática, acceso desde otro dispositivo, rechazo de borrador, aislamiento entre cuentas con el mismo email, desvinculación explícita y recuperación de aprobación incompleta. Pruebas de UI del recorrido único y de respuestas de sincronización atrasadas. También pasaron dispositivos, pagos, cupos, moderación, navegación de Admin, formulario de recuperación e inicio.

## Despliegue
Desplegar releases/worker-UADAVSTREAM-V11.7-11744.js conservando bindings y secretos. Las tablas se preparan automáticamente. Confirmar build 11744 en /api/health. La web 12039 comprueba ese mínimo antes de enviar una solicitud con cuenta.

Probar con una cuenta de prueba nueva: crear artista, editar borrador, aprobar publicación en Admin y comprobar el mismo artista desde un dispositivo vinculado. No borrar ni recrear la cuenta del usuario actual para probar.
