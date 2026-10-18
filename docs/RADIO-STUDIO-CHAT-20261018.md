# Radio Studio: chat y respuestas — 18/10/2026

## Implementado en la rama
GET/POST radio-studio/chat exige cuenta y permiso vigente sobre la emisora. Devuelve mensajes de esa comunidad y permite responder un mensaje existente. El servidor fija emisora y alias de la radio; no acepta cambiar de emisora o alias desde el cuerpo. La respuesta usa el circuito de moderación existente. El permiso se valida de nuevo al aprobar un mensaje pendiente: revocación impide publicar.

La pantalla permite actualizar chat, elegir Responder, cancelar la referencia y enviar texto de hasta 1000 caracteres. Bloquea clics duplicados y conserva texto/referencia si no se confirma el envío. Cambio de cuenta limpia mensajes y borrador. Un chat fallido no bloquea la bandeja de pedidos. Se usa actualización explícita, no se promete chat instantáneo ni Web Push.

## Pedidos
Studio actualiza D1 y replica el estado al registro KV cuando todavía existe en ese historial limitado. Responde kv_mirror_updated=false si falla la réplica; la interfaz indica estado guardado en Studio con respaldo pendiente. No hay transacción distribuida ni garantía de orden ante actualizaciones concurrentes. El D1 sigue siendo la fuente de Studio.

## Evidencia
33 pruebas locales de radio/Studio/Admin/entrada de perfil: satisfactorias. Integración de permisos ampliada: respuesta a oyente, aislamiento entre radios, intento de identidad de operador ajeno, moderación, aprobación, revocación antes de aprobación y fallo KV con D1 conservado: satisfactoria.
Regresiones de interacción, Cartelera y Press Kit: satisfactorias. No se enviaron mensajes remotos ni se concedieron permisos reales.

## Límites
No hay distintivo público verificado de operador: el chat público sigue usando aliases de texto. El alias no debe presentarse como prueba de identidad.
Falta desplegar este Worker actualizado sólo en staging y probar Admin → permiso → perfil → Studio → pedido/chat → revocación con sesiones de prueba autorizadas. Pages no despliega Worker.
No se modificaron producción, cobros, secretos ni permisos reales.
