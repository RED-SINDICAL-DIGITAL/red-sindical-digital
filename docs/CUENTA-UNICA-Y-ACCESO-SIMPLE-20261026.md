# Cuenta única y acceso simple · decisión de producto · 26/10/2026

**Actualización27/10Argentina:** QA real11767 informada `complete`: enlace recibido/canjeado, clave vieja revocada y acceso nuevo privado, oferta ficticia sin publicación. Evidencia `evidence/bolsa-11767-recuperacion-real-aprobada-20261027.json`. No repetir correo, laboratorio o configuración. La recuperación pública y entrada general por correo/Google siguen pendientes.11768 añade respaldo D1 consistente, exclusión de pruebas temporales, retención acotada y consulta privada de vencimiento; despliegue y diagnóstico11768 ya aprobados según operador (14ofertas/11postulaciones, respaldo guardado, vencimiento/avisos) y rechazo HTTP404 sintético confirmado por Work. No repetir esa intervención. Guía actual `BOLSA-11768-RESPALDO-Y-VENCIMIENTO.md`. Las referencias anteriores a ensayos pendientes más abajo son historia, no instrucciones actuales.

El usuario aprobó una cuenta UADAV para todas las secciones, correo privado y acceso opcional con Google. Solicitó recibir por correo lo necesario para recuperar sus accesos porque los códigos y archivos actuales resultan difíciles incluso para él. La prioridad es que una persona sin conocimientos técnicos pueda volver a Mi Perfil sin administrar claves largas.

## Experiencia acordada

1. La navegación pública y los circuitos gratuitos actuales continúan abiertos. La publicación de Bolsa sigue siendo gratuita e inmediata, con moderación posterior; las postulaciones mantienen su consentimiento explícito.
2. Para usar una cuenta sincronizada: **Continuar con Google** o **Continuar con mi correo**. La segunda opción acepta proveedores distintos de Google. Una misma pantalla sirve para entrar o crear la cuenta cuando corresponda, sin obligar a decidir entre “registrarse” e “iniciar sesión”.
3. El correo contiene una sola acción principal: **Entrar a Mi Perfil**, **Confirmar mi correo** o **Recuperar mi oferta**, según lo solicitado. El enlace dura hasta 15 minutos desde la emisión y se consume una sola vez. Si venció, se solicita otro; no se recupera ni reenvía el token anterior.
4. Un enlace abre una pantalla sencilla con confirmación explícita. El GET de un lector de correo o escáner no consume el acceso. El receptor debe borrar el fragmento antes de cargar recursos ajenos, impedir filtraciones y canjear por POST.
5. Mi Perfil reúne biblioteca, trabajos, postulaciones y perfiles autorizados. Cada sección conserva sus permisos. No se obliga a volver a introducir el correo si ya está verificado en la cuenta y la persona autoriza usarlo para esa operación.
6. Los códigos largos y archivos existentes permanecen disponibles como respaldo avanzado hasta que su reemplazo completo esté probado. QR/vinculación entre dispositivos se conserva para televisores y otros equipos. No eliminar los accesos actuales durante la transición.

“Todos los códigos por correo” se implementa como **accesos temporales y recuperables**, sin enviar un inventario de claves permanentes. No se envían claves de Admin, secretos del Worker, códigos de otros usuarios ni credenciales de operador de radio como parte del correo general.

## Datos y permisos

- Pedir lo mínimo necesario y explicar el uso: el correo es un dato personal, no un campo inocuo ni una contraseña. DNI, teléfono, fecha de nacimiento y domicilio no son requisitos del acceso general. Cada función puede necesitar datos propios al utilizarse.
- El correo de cuenta es privado por defecto. Un correo de contacto publicado en una oferta o perfil tiene otra finalidad y no se publica automáticamente desde la cuenta.
- El identificador interno de la cuenta permanece estable; el correo puede cambiar mediante un flujo verificado. El cambio no adopta cuentas, ofertas ni artistas ajenos.
- Google se enlaza mediante una identidad validada por el backend (`issuer`/`sub`), no por un email o ID enviado libremente por el navegador. Coincidencia de correo no autoriza fusionar cuentas existentes: hace falta demostrar control de ambas identidades.
- Para Google se solicita solo lo necesario para identificar al usuario. Nombre visible y foto se pueden editar/omitir; no se solicitan permisos de Gmail, Drive, contactos ni YouTube para entrar a UADAV.
- Entrar a una cuenta no acredita propiedad artística, afiliación, PRO, permisos de Radio Studio o Admin. Se mantienen las comprobaciones y revocaciones de cada función.
- Autorizar avisos de servicio o usar Google no suscribe a publicidad/newsletters. Preferencias de avisos separadas; evitar correos innecesarios.
- Un export privado autorizado de Admin debe incluir el nuevo dato con su estado de verificación y respetar permisos/borrado. No usar ni publicar una lista de correos desde el frontend.

## Mensajes y errores comprensibles

| Situación | Respuesta prevista |
|---|---|
| Solicitud enviada | “Revisá tu correo. Si corresponde, vas a recibir un enlace para entrar.” Resultado uniforme, sin revelar si existe una cuenta. |
| Correo no recibido | Revisar spam, corregir dirección o solicitar otro después del tiempo de espera. Un solo botón de reintento; no envíos paralelos. |
| Enlace vencido/usado | “Este enlace ya no está disponible. Pedí uno nuevo.” No mostrar tokens, SQL o respuestas del proveedor. |
| Cuenta ya abierta | Confirmar expresamente a qué cuenta se vincula el correo/Google y qué pasará con los datos de este dispositivo. |
| Error de red | Conservar la sesión/datos actuales y permitir reintentar sin duplicar operaciones. |
| Google no disponible | Mantener correo y los respaldos existentes; no crear otra cuenta de forma silenciosa. |

Objetivos de UI: una acción principal por pantalla, etiquetas claras, foco visible, navegación con teclado, texto legible, botones táctiles amplios, estados de carga y reintento sin formularios duplicados. Confirmaciones adicionales solo donde cambien datos o permisos sensibles. Debe probarse con usuarios y dispositivos reales; escribir estos objetivos no equivale a aprobar accesibilidad ni UX.

## Estado real de implementación al27/10

Mi Perfil tiene cuenta interna, sincronización, dispositivos, respaldo y vínculos artísticos. **Todavía no tiene correo verificado, Google o entrada general por enlace de correo.** No mostrar botones de acceso que carecen de backend.

El receptor Pages11767.1 existe y fue publicado; su QA de recuperar una oferta ficticia cerrada por correo fue informada aprobada. No es todavía un receptor de login/verificación de cuenta. El núcleo de outbox está integrado únicamente en esa QA privada; rutas generales503. Guardar la oferta recuperada en Mi Perfil es un acto voluntario posterior, sin login o fusión por email.

11768 fue desplegado e informó respaldo D1 consistente14ofertas/11postulaciones guardado, autenticación temporal excluida y vencimiento/avisos sin duplicado en dos turnos. Work confirmó health11768 y un POST sintético rechazado404 a esa QA vencida. No repetir correo/laboratorios/cron/respaldo o pedir nuevos secretos por esos pasos. No se recibió el respaldo privado nuevo ni se restauró íntegramente. Evidencias `evidence/bolsa-11768-respaldo-vencimiento-aprobado-20261027.json` y `evidence/bolsa-11768-rechazo-vencimiento-http-20261027.json`.

## Integración siguiente antes de publicar

- El correo de recuperación debe verificarse con consentimiento separado del contacto público. Para ofertas existentes, demostrar primero la autoridad actual mediante clave/vínculo vigente; nunca adoptar una cuenta u oferta por coincidencia de email.
- Un identificador de cuenta estable debe sostener correo/identidades y sesiones. Verificación, cambio, revocación, recuperación, exportación y borrado deben cubrir ese modelo; cuenta de origen y destino confirmadas explícitamente, sin fusión automática.
- Hallazgo de lectura del código actual: `/api/account/recovery` genera el secreto en el servidor, revoca los anteriores y lo devuelve después del batch. Un fallo de respuesta posterior puede dejar al cliente sin la nueva clave. Antes de extender esta ruta al correo, se necesita intención idempotente y reconciliación que conserve el acceso en una respuesta incierta. No afirmar que este cambio ya está escrito o desplegado.
- Las mutaciones de seguridad nuevas deben revalidar identidad/revocación dentro de su lote D1. La lectura de `/api/account/identity` al comienzo no basta frente a una revocación concurrente. Revisar y probar también borrado, dispositivos y permisos artísticos.
- Cuotas globales atómicas, presupuesto compartido y prioridades, antienumeración de mensajes/tiempos, plazo y un solo canje. El destinatario, cuerpo y retorno no se aceptan libres desde el cliente. No usar recuperación de oferta como credencial de cuenta.
- Integrar el receptor por protocolo explícito con confirmación POST, fragmento borrado y respuesta incierta reintentable; formularios mínimos y un propósito por mensaje. Los respaldos actuales permanecen hasta probar el reemplazo completo.
- Google es opcional posterior, con cliente propio de staging y verificación backend de issuer/sub. No bloquea artificialmente el cierre de Bolsa y no solicita Gmail/Drive/contactos. Una identidad Google no acredita propiedad artística o permisos de operador/Admin.
- Probar con datos ficticios y luego recepción propia autorizada: usado/vencido, revocación y cambio de correo, dos cuentas/dispositivos, rollback/respuesta perdida, regresiones Bolsa/artistas/Radio, teclado/lector y dispositivos físicos. Una nueva prueba real debe cerrar un flujo nuevo concreto; no repetir la11767 aprobada.

Brevo comparte la cuota gratuita observada de300envíos/día entre las secciones; no hay plan pago o gasto automático autorizado. Los avisos comunes permanecen en Mi Perfil y acceso/seguridad tienen prioridad. Estado de cuatro frentes pendientes y vencimiento aprobado: `BOLSA-ESTADO-Y-CIERRE-20261025.md`.
