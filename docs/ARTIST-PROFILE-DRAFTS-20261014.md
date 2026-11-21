# Borrador privado y publicación del perfil de artista

## Estado
Implementado en rama de auditoría; pendiente de desplegar este Worker en staging y ejecutar el circuito real. No habilitado ni desplegado en producción.
Worker de esta entrega: 2f0e0ffd6dd7748240a098c576d1b73e3c534494.
Blob: b040e6f758c6aa7627b1650e4ec78c2eaf53a03f.
[Worker completo fijado](https://raw.githubusercontent.com/RED-SINDICAL-DIGITAL/red-sindical-digital/2f0e0ffd6dd7748240a098c576d1b73e3c534494/worker.js).

## Guía del artista
- Guardar borrador: conserva tus datos privados y permite recuperarlos al abrir el editor. No solicita publicación.
- Enviar a revisión: guarda el borrador y lo presenta a moderación. La versión pública anterior se conserva mientras espera.
- Si el perfil es privado, enviar cambios no lo vuelve público automáticamente ni sustituye la verificación del reclamo.
- Si falla la cola de revisión, el borrador queda guardado y se indica que hay que reenviar.
- Un rechazo conserva el texto para corregirlo.
- Si otro dispositivo guardó una versión más reciente, el servidor rechaza el guardado desactualizado con 409. El formulario no debe vaciarse.
- El guardado no activa PRO, destacados ni otros productos.

## Guía del administrador
La cola de moderación existente sigue recibiendo los envíos. Una aprobación comprueba el propietario actual, la versión pública previa y la revisión privada enviada. Si existe una revisión privada posterior al iniciar la comprobación, se rechaza ese envío antiguo en vez de aplicarlo.
Rechazar la solicitud no elimina el borrador del artista.
Publicación de un perfil nuevo y aprobación del texto son decisiones distintas.
Los envíos antiguos anteriores a esta entrega siguen en su cola original; esta versión no los migra automáticamente al nuevo almacenamiento privado.

## Almacenamiento y seguridad
Tabla D1 nueva artist_profile_drafts: artist_id, claim_id, patch_json, revision, state, updated_at.
Se crea bajo demanda, sin borrar datos. Se incluye en exportación administrativa y en el procedimiento existente de eliminación autorizada de un artista.
Solo el acceso privado validado puede recuperar el borrador; la proyección pública usa el catálogo publicado.
GET privado lleva Cache-Control no-store. La propiedad se valida antes del acceso y también en la escritura SQL.
La escritura usa revisión condicional para impedir que dos guardados basados en la misma versión se reemplacen silenciosamente.
La vinculación del borrador al claim evita entregar el texto privado del propietario anterior al nuevo propietario.
Los clientes anteriores conservan la operación de guardar/enviar; el cliente nuevo manda draft_revision y ofrece guardado separado. Sin el Worker actualizado, el botón separado permanece oculto.

## Pruebas locales
tests/artist-profile-drafts.mjs: guardado y reapertura; aislamiento público; conflicto obsoleto y simultáneo; rechazo de revisión superada; aprobación actual; fallo de cola; rechazo conservando texto; perfil oculto y denegación al cambiar propietario.
También pasaron 14 pruebas de helpers del editor y seis suites de integración relacionadas con artistas, propiedad, privacidad y consultas. Sintaxis del Worker y scripts inline comprobada.
Estas pruebas usan Worker real + SQLite/adaptador KV local. No equivalen a D1/KV remoto ni a prueba visual del cambio nuevo.

## Límites
D1 y KV no comparten una transacción. Una aprobación ya iniciada puede intercalarse con otra edición después de la comprobación de revisión. Se conserva el borrador nuevo, pero falta serializar completamente todos los escritores del catálogo para garantizar orden de publicación entre procesos concurrentes.
Las interrupciones en la aplicación de una aprobación y las entradas legacy de moderación necesitan pruebas y recuperación adicionales. No declarar terminado el ciclo administrativo por las pruebas locales.
La tabla conserva únicamente la versión privada más reciente; no incorpora un historial completo de cada edición.

## Próxima validación
Actualizar exclusivamente uadav-api-staging con el Worker fijado, conservar bindings y variables; esperar compilación del frontend de pruebas.
Crear o abrir artista sintético → Guardar borrador → salir/reabrir → comprobar texto → Enviar a revisión → aprobar desde Admin de pruebas → comprobar proyección pública según visibilidad.
Repetir rechazo, cambio entre dispositivos y permisos. La clave de Admin staging se introduce únicamente en el navegador del usuario, nunca en el chat.
