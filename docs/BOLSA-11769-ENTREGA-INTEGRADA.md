# Bolsa11769 · cuenta por correo, respaldo y fuentes · solo staging

11768 ya está aprobado para el vencimiento original y su respaldo14/11, según el reporte del operador y el rechazo HTTP posterior observado por Work. **No repetir11767, los laboratorios anteriores, la espera de dos cron o esa postulación vencida.**

11769 entrega código y pruebas nuevas. No está desplegado en los Workers al escribir esta guía. Las pruebas automáticas usan datos sintéticos y correo simulado. Faltan las dos acciones de correo de cuenta, el ensayo del nuevo respaldo privado en la base aislada y el recorrido físico PC/celular. No declarar Bolsa terminada o lista para producción por un CI aprobado.

## Una descarga, dos Workers existentes

Descargar `releases/uadav-bolsa-staging-11769.zip` desde la rama `release/radio-studio-staging-rc-20261020`. Contiene:

| Archivo del ZIP | Destino exacto en Cloudflare |
|---|---|
| `worker.js` | **uadav-api-staging**, `https://uadav-api-staging.uadavstream.workers.dev` |
| `restore-qa-worker.js` | **uadav-restore-qa**, `https://uadav-restore-qa.uadavstream.workers.dev` |
| `LEEME-STAGING.txt` | Guía breve de esta misma secuencia |

No mezclar los archivos. Se conservan los bindings y secretos existentes de cada Worker. La API mantiene su DB/KV, Admin, `BREVO_API_KEY`, `BREVO_QA_RECIPIENT`, `JOB_RECOVERY_ENCRYPTION_KEY`, cron `*/15 * * * *` y `JOB_STAGING_CRON=bolsa-only`. El restore conserva **su propia DB aislada**, `QA_RESTORE_KEY` y `QA_RESTORE_ONLY=true`.

No crear bases, claves, Workers o cron nuevos. No pegar SQL manual: Preparar instala únicamente el esquema de correo en staging, con comprobación de huella. La base aislada debe conservar el guard11762 con las seis fases completadas y la misma clave; una base vacía, ajena o sin esa evidencia se rechaza. Los datos del laboratorio anterior no se borran.

Pages se publica desde `audit/continuidad-demo-20261019`, con su compilación que sustituye los destinos productivos. No copiar el frontend desde la rama Worker. Producción, `main`, variables y flags productivos quedan intactos.

## Secuencia única del operador

1. Publicar los dos archivos en los dos Workers de staging de la tabla. Comprobar `/api/health` de la API, build11769, y `/health` del aislado, versión `11769-account-restore`. El despliegue no habilita correo general ni restore operativo.
2. Abrir [Configurar correo](https://uadav-stream-staging.pages.dev/configurar-correo.html), entrar con el Admin existente de staging y tocar **Preparar acceso de prueba**. No envía correo. Hasta terminar las comprobaciones, solo el destinatario QA ya configurado puede recibir enlaces.
3. En **la cuenta original** de Mi Perfil, abrir **Correo de mi cuenta**, escribir ese correo QA y marcar el consentimiento. Solicitar el enlace de **confirmación**, abrirlo en el mismo navegador/dispositivo con esa cuenta y tocar Confirmar. La comprobación de cuenta original es obligatoria: evita vincular el correo de otra persona a una cuenta iniciada por un tercero.
4. Pedir luego un enlace de **entrada** con el mismo correo. Abrir ese segundo enlace en el celular y confirmar. Debe abrir la misma biblioteca y los mismos trabajos/perfiles autorizados; no escribir una clave larga. Si el celular ya tiene otra cuenta, revisar la advertencia antes de cambiarla. La importación de favoritos locales es voluntaria.
5. Volver al panel de correo y tocar **Volver a consultar**. Los dos comprobantes deben corresponder a la misma cuenta y revisión de correo. Copiar el resultado seguro. **Habilitar acceso por correo en staging** queda disponible solo después de ambas pruebas reales; el backend también controla esa condición. Pausar revoca los enlaces pendientes. Estas pruebas son nuevas: verificar el correo de cuenta e ingresar; no repiten la recuperación de oferta11767.
6. En ese panel tocar **Descargar respaldo actual** y guardar el archivo en privado. La descarga comprueba el checksum estructural y calcula el SHA del archivo exacto. La nueva captura prueba además correo cifrado, nuevos dispositivos y versión del respaldo de cuenta. El informe dice descarga solicitada: seleccionarlo en el ensayo siguiente demuestra que el archivo está disponible. Un respaldo11768 sigue siendo válido como histórico, pero no acredita esos nuevos datos.
7. Abrir [el restore aislado](https://uadav-restore-qa.uadavstream.workers.dev/), usar la clave QA exclusiva existente y seleccionar **ese respaldo11769**. Ejecutar el ensayo. Hace lotes reanudables, provoca un fallo controlado para comprobar rollback y compara cuentas, dispositivos, vínculos, Bolsa, avisos y KV con el respaldo. Copiar solo el JSON seguro final. No mandar el respaldo completo, direcciones, claves o enlaces de correo al chat o a GitHub. Después se puede usar **Borrar copia aislada**; solo borra el espacio11769 y conserva el laboratorio anterior.
8. En PC y celular comprobar buscar, publicar una oferta ficticia, postularse con consentimiento, consultar con otro dispositivo por correo, cerrar/renovar, mensajes de error y teclado/tamaño de pantalla. Revisar que **Completar con Mi Perfil** solo rellene campos vacíos y no marque el consentimiento de postulación. No modificar la QA vencida original `JOB-MVPJ9WRW-439D4126D9AE` o su candidatura `POST-MVPJCNGX-E7683EC0`.

Si una consulta falla, conservar la pantalla y reintentar. Los paneles privados cierran su sesión después de diez minutos; volver a entrar con el mismo Admin/clave QA, sin crear secretos. Para canjear un correo tras una respuesta incierta, reintentar en la misma pantalla sin recargarla: conserva la misma credencial candidata en memoria. Si se perdió esa pantalla, solicitar otro enlace; nunca publicar el anterior.

## Qué cambia para la persona

Una dirección privada permite entrar o crear una cuenta después de demostrar control del correo. Los datos de una cuenta anterior se conservan **confirmando primero desde esa cuenta**; usar el formulario de entrada desde un equipo nuevo antes de confirmarla puede crear otra cuenta vacía. No hay fusiones automáticas por coincidencia de direcciones.

Mi Perfil conserva el identificador estable, biblioteca, trabajos vinculados y permisos artísticos. El contacto público de una oferta no se usa como prueba de propiedad. Una oferta o postulación antigua puede vincularse voluntariamente con su comprobante vigente. Entrar por correo no concede Admin, PRO o permisos de Radio Studio.

Los enlaces tienen una sola acción, duran15minutos, se confirman mediante POST y admiten un único canje. La URL borra el fragmento antes de cargar recursos; las dos páginas privadas tienen CSP estricta y no se pueden incrustar. Cambiar de correo mantiene el anterior hasta comprobar el nuevo. No se envían claves permanentes por correo ni se suscribe a publicidad. Google queda como opción posterior; no se muestra un botón sin implementación.

El respaldo avanzado se renueva con candidato guardado antes de la escritura, recibo idempotente y control transaccional de versión. Dos dispositivos no pueden sustituirse mutuamente el respaldo desde la misma versión. Una respuesta perdida se reconcilia con el candidato. La renovación requiere Web Locks; si el navegador no lo soporta, conserva el acceso y pide actualizar. Los dispositivos autorizados siguen vigentes hasta revocarlos.

La cuenta tiene consentimiento registrado y dirección cifrada. El índice de búsqueda usa HMAC. Se verifica autoridad y revocación dentro de la transacción. Respuestas uniformes y espera acotada de800–900ms preceden al envío en segundo plano. El nuevo circuito tiene presupuesto compartido de240mensajes/díaUTC, límites por dirección e IP y hasta tres intentos idénticos; el plan gratuito observado de Brevo es300/día, también compartido con otros usos del proveedor. No es ilimitado ni se contrató un plan pago.

Los dos endpoints antiguos de recuperación por clave de oferta siguen503. El circuito nuevo recupera **la cuenta** y sus trabajos ya vinculados. Los avisos habituales permanecen en Mi Perfil; no se inicia una campaña o envío masivo.

## Fuentes externas

Admin permite **Conectar convocatorias de Agencia Beat**: configura su feed público de Google Blogger, inicialmente inactivo, sin publicación automática. El lector fijo acepta solo sus categorías laborales/casting/audiciones/convocatorias y devuelve fichas para revisar. La lectura pública real observó25entradas y **cero convocatorias elegibles**; no se inventó ni publicó una oferta. Esa evidencia valida la conexión/filtrado, no la publicación o baja de un empleo real.

El fetch operativo HTML permite únicamente los editores explícitos del código y verifica cada redirección antes de consultar. La comprobación DNS es previa, **no fija la IP de la conexión**. La política reduce la superficie a editores de confianza; no equivale a fetch arbitrario seguro contra un editor comprometido. Para otros dominios, subir HTML guardado o CSV: el servidor analiza el archivo sin contactar ese sitio y no ejecuta sus scripts. La ficha externa conserva enlace de origen y revisión Admin; postularse allí no crea una candidatura interna.

## Respaldo y límites de recuperación

El nuevo export captura las tablas permanentes presentes de su inventario en un mismo lote D1, con las proyecciones Bolsa derivadas del snapshot. El ensayo restaura18tablas seleccionadas de ese export. Las otras claves KV se leen por separado; no se afirma un snapshot distribuido atómico KV/D1. Incluye correo cifrado y versiones de respaldo; excluye activación, desafíos, outbox temporal, recibos de renovación y contadores. Al recuperar identidades históricas, la preparación explícita y desactivada no repone tokens o activaciones viejas.

El ensayo remoto escribe exclusivamente tablas `restore11769_*` en la DB QA existente. La comparación completa, el rollback, el reintento, la concesión de autoridad y los límites de nombres están cubiertos por pruebas sintéticas. El respaldo privado real todavía debe ensayarse mediante la secuencia anterior. Una copia histórica no se promueve automáticamente: una recuperación operativa debe preservar revocaciones/borrados posteriores y renovar autoridad. **Los flags de restore operativo continúan apagados.** No se acredita recuperación de pagos, de toda la plataforma o failover productivo.

## Validación y entrega

Pruebas locales: **294/294 Worker,186/186 Pages,32 controles workerd1.20261025.1,12/12 Radio**, además de política pública, compatibilidad KV, cuenta/borrado, avisos, importación/exportación, fuentes embebidas, sintaxis y ZIP. Los51artefactos anteriores permanecen byte a byte iguales. Módulo de checksum de Pages idéntico al del Worker. Evidencia numérica y huellas: `evidence/bolsa-11769-verificacion-local-20261027.json`.

La instalación de Chromium para revisión visual local falló al descargar el binario; no se repitió indefinidamente. Las pruebas de DOM/red y motor Cloudflare no acreditan UX visual, accesibilidad completa, recepción real de los nuevos mensajes ni dispositivos físicos. Los reportes de CI/Pages se registran después de persistir los commits. CI no despliega los Workers; la API observada antes de esta entrega seguía11768.

Los pendientes de cierre son esas comprobaciones reales, el comportamiento de una convocatoria real elegible y el recorrido físico. Cartelera continúa después de validar Bolsa, respetando las decisiones comerciales existentes. No se promete un porcentaje o fecha que oculte estas dependencias.
