# Cuenta única y acceso simple · decisión de producto · 26/10/2026

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

## Estado real de implementación

Mi Perfil actual ya tiene cuenta interna, sincronización, dispositivos, recuperación mediante respaldo y vínculos artísticos. **Todavía no tiene correo verificado, Google ni entrada por enlace de correo.** No se modificó su UI en este avance para mostrar botones que aún no funcionarían.

Preparación nueva: `scripts/access-mail-message.mjs` contiene tres mensajes reutilizables con una acción, hora argentina explícita y token en fragmento; `scripts/brevo-staging-mail.mjs` contiene transporte fijo y acotado para QA futura. La ruta `/acceso-correo.html` de esos mensajes es un destino reservado: **la página y el canje de cuenta todavía no están implementados**. No enviar estos mensajes al público ni activar recuperación.

El núcleo de Bolsa preparado conserva sus transacciones de canje, pero no es un sistema de login de cuentas generales. La cuenta unificada necesita sus propias identidades verificadas, intenciones de acceso y sesiones revocables. No convertir la recuperación de una oferta en acceso automático a una cuenta personal porque tenga el mismo correo.

Ver `CORREO-BREVO-PREPARACION-20261026.md` para pruebas y límites. El diagnóstico11766 ya fue informado como received por el operador, con recepción comprobada y recuperación apagada. No verifica una identidad de cuenta. La revisión del outbox ahora canjea por posesión del token recibido y conserva el mensaje inmutable cifrado; está probada localmente, sin integrar en el Worker principal. Se prepara un ensayo D1 en el laboratorio existente según `BOLSA-11766-LABORATORIO-RECUPERACION.md`. Pages y producción no cambian; endpoints públicos503.

## Integración y aceptación antes de publicar

- BrevoFree, dominio/remitente por capturas;11765sandbox accepted y11766received informados por el operador. Prueba real a su dirección propia autorizada en la pantalla privada, sin que Work viera dirección/claves o enviara correo. Este paso ya aprobó; no repetir la configuración o el correo diagnóstico.
- Emisión/canje de acceso y verificación de correo en D1, enlace único, límites atómicos, antienumeración y confirmación segura de cambio de cuenta. Respaldo, restauración, borrado y revocación deben cubrir las identidades nuevas.
- Alta de cliente Google separado de staging, configuración de orígenes/consentimiento y verificación backend. Migración voluntaria desde las cuentas actuales, preservando datos y permisos sin fusiones por email.
- Receptor del enlace y UI conectados solo cuando el backend esté listo; control de sesión y del retorno permitido, sin redirección arbitraria.
- La respuesta incierta y los bytes inmutables ya tienen solución preparatoria local para recuperar una oferta: posesión del token recibido y canje atómico, sin fabricar recibos. Falta validación D1 remota nueva, integración HTTP, cuotas/retrasos/reintentos y extensión específica a las identidades/sesiones de cuenta. El canje de una oferta no abre Mi Perfil ni fusiona cuentas por coincidencia de correo.
- Probar recepción real autorizada, enlace usado/vencido, reenvío, cambio/revocación de correo, dos cuentas/dispositivos, regresión de Bolsa/artistas/Radio, teclado/lector de pantalla y dispositivos físicos.

Brevo comparte sus 300 envíos gratuitos diarios entre todas las secciones. Google no necesita que Brevo envíe un código en cada ingreso. Los avisos comunes permanecen en Mi Perfil; recuperación y seguridad tienen prioridad en el presupuesto de correo. No se configura plan pago ni gasto automático.
