# UADAV STREAM · Acceso por correo primero — QA 24/11/2026

## Decisión de experiencia de usuario
- **Explorar, escuchar y mirar**: no pedir cuenta.
- **Guardar favoritos, publicar, contratar o gestionar**: correo privado, enlace de un solo uso, confirmación explícita, sesión persistente y revocable.
- **Titularidad de artistas**: control independiente del correo. Nunca otorgar la titularidad de un artista existente solo por conocer su email o poseer un token heredado.
- **Recuperación antigua y códigos de dispositivos**: preservar mientras dura la migración, sin borrados ni cambios automáticos de credenciales.

## Cambio implementado únicamente en QA
`uadav-profile-email.js`: presenta acceso por correo antes de las tareas cotidianas de Mi Perfil si `/api/access/email/status` confirma `installed` y `enabled`. Si está instalado pero pausado, muestra mensaje y conserva el circuito anterior. Si la API no responde, la tarjeta no altera el flujo actual. Botón de 44px para facilitar el toque; lenguaje sin jerga.

No se cambia la sesión, no se ejecuta un login automático y no se publica en producción. `scripts/test-account-email-first-ui.mjs` y el workflow Admin 2.0 comprueban presencia del botón, estado habilitado y conservación del acceso heredado.

## Bloqueos antes de activar acceso por correo para todos
1. **Titularidad de artistas:** el test «ownerless legacy token must not bypass an active owner» fallaba por expectativa HTTP `401` vs respuesta real `403`. El Worker **ya rechazaba** el acceso legado cuando existe titular activo. Se corrigió el test para exigir `403`, ausencia de consultas privadas y bloqueo de modificaciones; la integración general aprobó en el commit `4eff5a7`. No se modificó el Worker ni se habilitó acceso antiguo. Falta prueba remota con datos QA antes de promover.
2. **Radio Studio móvil**: prueba visual del PR #69 falló por timeout; examinar artefactos y reproducir.
3. **Protección de staging**: verificación de preservación falló; revisar diferencias Worker y rollout, no modificar hash para forzar PASS.
4. Verificar frontend Pages que realmente responde, Worker/versión real, bindings, plantillas de correo y entrega con un destinatario QA controlado. Un envío aceptado no es entrega confirmada.
5. Pruebas de migración con cuenta sintética que ya tenga favoritos, listas, artista propio y segundo dispositivo. Confirmar idempotencia, links vencidos, cambio de correo, revocación, cierre de sesión y recuperación sin duplicar cuentas.
6. Verificar privacidad y mecanismos apropiados para menores y responsables legales según edad/jurisdicción; no inferir que un niño pueda registrarse solo.
7. Evaluar cuentas que no poseen correo y procedimientos seguros de asistencia.

No fusionar ni desplegar en producción hasta superar estos pasos. La regresión estática no certifica pruebas reales del navegador ni Cloudflare.

## Regresión de interfaz y acceso heredado (24/11/2026)
El contrato `tests/profile-intuitive-ui.test.cjs` seguía exigiendo colocar el correo debajo de Ajustes. Ahora comprueba su posición destacada antes de las tareas cotidianas, sin eliminar «Cuenta y seguridad» ni el mecanismo anterior de recuperación. Se corrigió además un error de sintaxis de la nueva prueba, con commit `6620192`. El resultado final de CI debe revisarse antes de cualquier promoción; la protección de staging continúa como bloqueo independiente.
