# Participación desde el reproductor — 2026-10-19

Staging y rama de auditoría; sin cambios en producción ni permisos de operadores.

- Radio expandida ofrece Pedir una canción y Mensajes de la radio.
- La ruta se construye con la emisora actual; sólo admite los destinos requestsSection y chatSection.
- Navegar minimiza la vista expandida, restaura el fondo y conserva el audio original.
- El perfil carga la emisora, desplaza al destino y enfoca canción o mensaje.
- Formularios con etiquetas accesibles, campos de 16px y controles de 48px; chat en columna en móvil.
- Los pedidos y el chat son circuitos separados. El pedido no garantiza emisión. El chat es público; no compartir datos privados.
- Se conserva confirmación de guardado, revisión pendiente y borradores ante fallos; no se cambia el backend ni se concede acceso.

Validación local: 29 pruebas UI/rutas/controles nativos aprobadas. Integraciones aisladas de Worker SQLite/KV para mensajes, pedidos, moderación y Radio Studio aprobadas; aislamiento por estación y cuenta y respuestas privadas no-store. No se enviaron nuevos mensajes/pedidos a servicios remotos ni se otorgaron permisos reales.
La aceptación con una cuenta de operador autorizada en Studio y móviles físicos continúa pendiente.
