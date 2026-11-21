# Revisión legible de Press Kit

Hallazgo de la prueba PRO real: el envío se presentaba como Contenido · presskit y obligaba a abrir JSON para identificar al artista. Al aprobar mostraba Publicado aun si el perfil seguía privado.

Se unificó la presentación de perfiles y Press Kit: título con nombre del artista, versión, nombre/presentación/ciudad/especialidad cuando están disponibles; contenido técnico plegado; Aprobar cambios y Rechazar cambios; éxito aclara que la visibilidad del perfil se conserva. Pendientes también identifica nombre y versión del Press Kit. Datos mal formados, null o arrays no interrumpen la bandeja.

Cuatro pruebas de regresión pasan localmente: identidad y versión, nombre desde snapshot antiguo, tolerancia a datos inválidos y separación de otros ámbitos/contrato de rechazo. Sintaxis de ambos JS correcta. Prueba agregada a CI; falta verificar su resultado y la interfaz autenticada desplegada. No se aprobaron nuevas publicaciones ni se cambiaron permisos o pagos en esta etapa. Producción y Worker sin modificaciones.
