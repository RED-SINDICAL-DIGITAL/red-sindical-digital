# Cuenta única y acceso simple · decisión de producto · 26/10/2026

**Actualización27/10,15:50Argentina:**11769 desplegado. Work comprobó correo de cuenta instalado/habilitado y qa_verification/qa_login true, después del «hecho todo» del operador. Cuenta y correo aprobados en staging. No repetir esos mensajes o despliegues. Informe privado del ensayo ahora recibido:14/14fases,rollback y comparación aprobados,1identidad de correo. Evidencia de restauración separada; no inventar comprobaciones físicas más allá de lo informado. Google opcional posterior. Evidencia `evidence/bolsa-11769-despliegue-correo-observado-20261027.json`.

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

## Estado de implementación11769

Mi Perfil tiene cuenta interna, sincronización, dispositivos, respaldo y vínculos artísticos.11769 incorpora correo privado verificado/consentido y entrada general por enlace, con identificador de cuenta estable; el acceso general fue habilitado explícitamente en staging después de ambas comprobaciones, según el estado remoto15:50Argentina. Google no está implementado y no se muestra como botón operativo.

La persona que ya tiene una cuenta debe confirmar primero desde esa cuenta y abrir ese primer correo en el mismo dispositivo autenticado. Esta exigencia evita vincular el correo de otra persona a una cuenta ajena. Después puede entrar por enlace desde otro equipo. Una dirección sin identidad previa crea una cuenta solo al consumir la prueba recibida; no adopta datos antiguos por coincidencia de contacto. El cambio de correo mantiene el anterior hasta verificar el nuevo.

La nueva pantalla borra el fragmento antes de recursos, confirma mediante POST y conserva la candidata en memoria para reintentos de una respuesta incierta. No manda claves permanentes por correo. Genera un permiso de dispositivo y conserva los permisos de cada sección; no concede Admin, PRO o Radio. Los trabajos ya vinculados se recuperan por cuenta; las rutas antiguas de recuperar una clave de oferta siguen503.

La rotación avanzada anterior podía revocar antes de devolver una clave generada solo en el servidor.11769 la sustituye por candidato generado/guardado antes de escribir, intención idempotente, recibo, versión transaccional y reconciliación. Dos dispositivos con la misma versión no se pisan; Web Locks protege pestañas del mismo navegador. Una versión de frontend antigua recibe409 sin mutación. Las comprobaciones de autoridad están dentro del lote; se conservan revocaciones y dispositivos según su finalidad.

El export incluye identidades cifradas y versiones permanentes; excluye enlaces temporales, configuración de activación, cuotas y recibos. El nuevo ensayo de restore opera solo en su namespace dentro de la DB QA existente y no habilita recuperación operativa. Los límites del futuro uso de una copia histórica están en la guía.

## Validación y pendientes

294pruebas Worker,186Pages,32controles workerd y12Radio locales aprobados, con correo simulado. Incluyen concurrencia, respuesta perdida, rollback, cambio/revocación/borrado, identificación de cuenta y protección frente a respuestas tardías. Se mantienen QR, respaldo largo y comprobantes.

La QA real11767 de una oferta ficticia y el respaldo/vencimiento11768 ya están aprobados; no repetirlos. Despliegue/confirmación/entrada ya acreditados por estado remoto; el operador informa también ensayo y comprobaciones hechos. Informe seguro del ensayo ya recibido y aprobado para contexto Bolsa/cuenta, sin repetirlo. PC/celular declarados realizados; no se certifica accesibilidad completa por una confirmación general. El cierre funcional de Bolsa queda a la espera de observar la fuente externa real preparada en staging. Las pruebas sintéticas no acreditan recepción real o UX física. Cada activación exige la misma cuenta/revisión verificada, no basta un informe copiado.

Brevo comparte la cuota gratuita observada de300envíos/día; el circuito nuevo reserva hasta240/díaUTC, con cuotas por IP/dirección y reintentos idénticos acotados. No hay plan pago o gasto automático autorizado. Los avisos comunes permanecen en Mi Perfil; acceso y seguridad tienen prioridad. Estado completo: `BOLSA-ESTADO-Y-CIERRE-20261025.md`.
