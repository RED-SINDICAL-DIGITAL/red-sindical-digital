# Beta: cierre funcional, pasada 1

Entorno exclusivo: staging. Producción sin cambios. Modelo: perfiles/eventos/Bolsa gratuitos; contratación y pago directos entre productor y artista; publicidad cotizada por administración. Sin nuevas membresías.

## Correcciones publicadas en esta pasada
- Alta pública: quitada la referencia a PRO como plan opcional.
- Para artistas: retirada oferta USD 3,99 mensual / USD 30 anual y sus cupos de promoción.
- Promoción: retirado tarifario fijo anterior de Cartelera y Hero; consulta a administración.
- Manual público/interno: eliminadas indicaciones de comprar PRO; explicados Postimages, vista previa y Hero público gratuito de Cartelera.
- No se modifica el historial de pedidos, pagos ni permisos históricos.

## Evidencia
- 699 comprobaciones de las suites node --test declaradas en workflows: aprobadas antes y después de la limpieza. No equivale a ejecutar todos los pasos de todos los workflows.
- 41 pruebas aisladas del Worker: almacenamiento laboral, postulaciones, vínculo de cuenta, vencimiento, migración, publicación de eventos, contratación privada y consultas publicitarias.
- 106 comprobaciones dirigidas de frontend (subconjunto parcialmente solapado con las anteriores): aprobadas.
- 5 pruebas de recuperación de presentación, en la rama frontend actual: aprobadas.
- Build de frontend staging: 201 archivos, API staging, sin despliegue manual ni recursos nuevos.
- Prueba real anterior de contratación directa: artista QA publicado por Admin, propuesta recibida en privado sin derivación sindical; estado Leída persistente tras actualizar. Referencia CON-bfe7e806d521d454694f1715a72310cd9753e2c371f746542ed0a685120eedfa. No se envió correo ni realizó pago.

## Pendientes para declarar la beta lista
1. Revisar después del despliegue frontend estas páginas y coherencia en celular/PC.
2. Pruebas reales completas de oferta/postulación y evento con imagen, edición y banner; no repetir publicación con datos reales durante QA.
3. Recuperación de cuenta por correo y vínculo de dispositivo de extremo a extremo. Los scripts HTTP requieren URL/credenciales de QA: su ejecución sin parámetros no cuenta como fallo del producto ni como validación.
4. Campaña comercial completa en staging: selección de provincia, entrega correcta, confirmación administrativa, bonificación y vencimiento. Las pruebas aisladas no sustituyen esta comprobación.
5. Cierre visual y de reproducción (pasada 2), respaldo/recuperación y paquete final (pasada 3).
6. VDO.Ninja experimental; recepción entre teléfonos, gorra y límites reales pendientes. Postimages: carga manual por enlace; integración automática pendiente del proveedor.

No requiere nuevo Worker por estas correcciones: son páginas, manual y documentación. El Worker existente de staging conserva las pruebas aprobadas. Los datos QA se conservan identificados hasta el cierre; no se borran datos reales.

## Pruebas reales completadas después de la pasada
- Evento QA: EV-5F48A70E-146B-4ED4-8C90-701ACB069A30. Publicación inmediata sin destaque pago, ficha pública, afiche visible, entrada gratuita y presencia en agenda comprobadas. Banner cargado; no aparece en Hero con la configuración actual. Pendientes edición y cambio de configuración desde Admin.
- Oferta QA: JOB-MW59R728-CD7BE189A265. Publicación pública inmediata comprobada.
- Postulación QA: POST-MW59YJQM-1336789C. Envío confirmado; seguimiento privado muestra Recibida. El contratante ve 1 postulación con nombre y mensaje sintéticos en su bandeja privada. No guardar ni publicar las claves de acceso en documentos.
- No se usó correo real; no se declara entrega de emails ni recuperación por correo como aprobadas. No hubo pago ni contratación real. Se mantienen pendientes las campañas reales de QA y sus controles territoriales, y pruebas adicionales con cuentas/dispositivos separados.

## Edición y Hero verificados con Admin
- Se confirmó modo mixto ya seleccionado; la portada ausente no se debía a una configuración genérica.
- La creación pública omitía el campo portada en el Worker. Corrección en 6b747fe944c7fc44dff3ab0e3c5e56b604a01a0f; despliegue confirmado por health y publicación pública completa. /api/health incorpora event_artwork_revision=20261106-public-cover-1.
- Se agregó portada y descripción breve al evento QA existente desde Admin. Guardado confirmado por aparición del evento y del texto editado en el Hero público, sin destaque pago.
- Campaña sintética QA-BETA-20261106 de Santa Fe/AR: guardada Pausada/Bonificada, sin cobro ni publicación. Intento de activar sin entrega verificada permaneció en el editor. No se declara entrega activa ni segmentación real aprobadas.
- Se agrega mensaje persistente de validación en el editor de campañas para evitar errores invisibles detrás de la ventana.
- Corrección Worker: 40 pruebas dirigidas aprobadas, incluida conservación del banner en alta atómica, catálogo, repetición y rechazo de cambios con la misma referencia; protocolos inseguros/credenciales no se conservan.
- Frontend: 14 pruebas dirigidas y sintaxis del Admin aprobadas. Recuperación de correo real, campaña activa/territorial/vencimiento y dispositivos separados siguen pendientes.

## Cierre de banner público y validación comercial · 2026-11-06
- Alta pública real en staging: EV-CC646B1F-FAB3-4831-870A-D84CD209D680, QA BANNER 20261106. Publicación automática, banner conservado y diapositiva activa comprobada en Hero. Sin edición desde Admin, destaque pago ni aviso por correo. Datos ficticios; no asistir.
- Aviso comercial retirado sobre Hero y trasladado a una sección desplegable al final de Publicar evento. Banner opcional gratuito visible junto al afiche sin desplegar opciones adicionales; verificado en staging.
- Tras recargar Admin, activar QA-BETA-20261106 sin entrega verificada conserva el editor y muestra: Primero verificá la entrega en la ubicación contratada. No se guardó ni activó la campaña; se conserva Pausada/Bonificada.
- 26 pruebas comerciales aisladas aprobadas: guardado y concurrencia, territorio enviado, rechazo de Worker antiguo, campañas futuras/vencidas, pausa y máximo de una diapositiva comercial. No equivalen a entrega territorial real de una campaña activa.
- Pendientes: campaña activa con comprobación pública por territorio y vencimiento, recuperación real por correo y dispositivos separados.

## Entrega territorial comprobada en API de staging
- Campaña CAMP-MW5EDGH7-ZXSBQ / QA-BETA-20261106 activada temporalmente como Bonificada, sin cobros. GET público con country=AR y province=Santa Fe devolvió la campaña identificada como Publicidad; province=Córdoba devolvió [].
- Se volvió a Pausada desde Admin y la consulta Santa Fe devolvió []. Estado final Pausada confirmado en tabla.
- Son consultas con territorio explícito: no prueban geolocalización de dos conexiones reales ni renderizado publicitario en esos dispositivos. Vencimiento real y conexiones/dispositivos siguen pendientes.
- Guía pública y sección Admin: se retira compra PRO residual y se aclara activación manual tras acreditación/entrega; automatización y garantía 24 h no están implementadas. Banner gratuito visible y consulta comercial al final del formulario documentados.

## Revisión consolidada sobre 8a16f08d
- Checkout limpio de la rama staging: 224 pruebas aprobadas en 29 archivos *.test.cjs de jobs, bolsa, profile, event, cartelera, commercial y advertising. Sin fallas ni omisiones en este conjunto; no representa toda la CI ni validación física multidispositivo.
- Build staging correcto: 201 archivos generados con UADAV_STAGING_ORIGIN. Solo preparación, sin despliegue ni cambios en producción.
- Mi Perfil diferencia comprobante de postulación de acceso a ofertas y describe contacto directo con artistas.

### Pendientes de cierre, por prioridad
1. Recuperación por correo con casilla real de QA y segundo dispositivo: verificar acceso, datos vinculados y revocación; no usar correos inventados para declarar entrega.
2. Recorrido visual y funcional en celular/tablet/Smart TV reales: publicación, postulación, retorno y reproducción. Las pruebas automatizadas no sustituyen estos dispositivos.
3. Publicidad: renderizado de la campaña en el espacio contratado, ubicación detectada desde conexiones de Santa Fe/Córdoba y vencimiento real. API territorial explícita y pausa ya verificadas.
4. Respaldo actualizado y ensayo final de restauración únicamente en base aislada; conservar procedimiento de reversión antes de una eventual publicación en producción.
5. Automatización comercial: acreditación verificada, activación e información de estado; no prometer automatismo ni SLA de 24 h hasta implementarlo y probarlo. La beta puede operar con activación administrativa expresamente informada.
6. En vivos y gorra: piloto VDO.Ninja entre dos dispositivos y enlace directo de donación al artista. Mantener indicación experimental hasta comprobarlo.

## Respaldo y recuperación: ensayo aislado adicional
- Worker: 43 pruebas aprobadas de exportación consistente, checksum, restauración de Bolsa/cuentas/Cartelera, transacciones con rollback, repetición idempotente y recuperación atómica. SQLite desechable con datos sintéticos; no se restauró ni exportó una base remota actual.
- Frontend: 42 pruebas aprobadas de recuperación por correo, consentimiento, control de cuenta/dispositivo, errores y respuestas tardías. No hubo envíos de correo reales en este ensayo.
- Comprobado que un respaldo corrupto o incompleto es rechazado, una falla revierte la transacción y un envío de correo interrumpido no se duplica automáticamente al restaurar.
- Siguiente validación real requiere una casilla de QA indicada por su titular y acceso al mensaje recibido. No se asume correo del usuario a partir de datos no confirmados.

## Validación adicional de vencimiento en staging
- CAMP-MW5EDGH7-ZXSBQ se asoció al evento ficticio EV-CC646B1F-FAB3-4831-870A-D84CD209D680 (tipo Evento, Hero). Se guardó Activa/Bonificada con vigencia 2026-11-04 a 2026-11-05.
- El 2026-11-06 la consulta pública Santa Fe devolvió [], aunque Admin mostraba Activo: la API excluye por fecha independientemente del estado administrativo.
- Estado final Pausada confirmado; se conservan fechas y nota del ensayo. Sin cobros.
- Alcance: prueba real de API con fechas pasadas, no transición de reloj de un dispositivo abierto ni renderizado publicitario real.
- Admin incorpora bloqueo de combinaciones sin renderizador compatible (artista/evento en Hero; evento en Cartelera; radio destacada; marca en banners/auspicio). 21 pruebas comerciales aprobadas, incluida regresión de cinco combinaciones inválidas.
- Recuperación: usuario reportó funcionamiento con su casilla; el navegador de QA sigue desvinculado y no demuestra recuperación de datos entre dispositivos. La salida del iframe se corrigió en perfil y puente de navegación y quedó verificada en staging.

## Hero comercial y navegación: cierre de comprobaciones
- Prueba visual real de CAMP-MW5EDGH7-ZXSBQ: Evento/Hero, activa bonificada y alcance internacional temporal, 2026-11-06 a 2026-11-07. Hero mostró 3 de 3, con QA BANNER como tercera propuesta identificada PUBLICIDAD · DESTACADO, conservando las dos editoriales. Ver evento abrió la ficha exacta.
- Se volvió a Pausada y alcance Santa Fe/AR. Tras recarga, Hero mostró 1 de 2: retiró la campaña y conservó las editoriales. Sin cobros. No se probó retirada sin recargar ni conexión física de otra provincia.
- 22 pruebas dirigidas aprobadas: cinco destinos de navegación principal, teclado en formularios, búsquedas móviles y respuestas tardías de Admin. El error de búsqueda simulado forma parte del caso aprobado, no de una falla operativa observada.

### Matriz honesta de disponibilidad para demo
| Circuito | Evidencia disponible | Pendiente |
| --- | --- | --- |
| Cartelera pública y banner | Alta completa y aparición en Hero de staging | Dispositivos físicos |
| Bolsa pública | Oferta, postulación y bandejas QA confirmadas anteriormente; búsqueda/limpieza y formulario sin sesión revisados | Recorridos físicos completos |
| Consultas al artista | Envío y recepción privada QA sin liberación sindical | Uso real fuera de QA |
| Publicidad | Entrega API Santa Fe, exclusión Córdoba, fechas pasadas, Hero visible y retiro tras pausa/recarga | Geolocalización de conexiones reales y vencimiento con página abierta |
| Recuperación por correo | Usuario reportó que funcionó; enlace sale del iframe comprobado | Datos recuperados y revocación desde un segundo dispositivo |
| Respaldo | Ensayos sintéticos aislados con rollback y checksum | Captura remota actual y ensayo de ese respaldo |
| Celular/tablet/TV | Reglas responsive y pruebas automatizadas de teclado/navegación | Validación física, reproducción y control remoto |
| Cobro publicitario | Circuito manual documentado | Automatización y SLA 24 h |
| Vivos y gorra | Propuesta piloto | Dos dispositivos y donación directa comprobados |

## Respaldo actual y restauración aislada completados
- Captura real desde Admin staging: 2026-11-06T21:51:55.054Z, 22 colecciones, 69 tablas, integridad declarada completa; checksum incorporado verificado en ensayo. Archivo privado conservado fuera del repositorio. No publicar su contenido ni credenciales.
- Se detectó que el panel antiguo exigía job_store_rates, job_owner_recovery_tokens y job_owner_recovery_v2, que el exportador omite deliberadamente por ser temporales. Corrección del validador D1 mantiene exigencia de metadatos, registros y credenciales persistentes. No cambia requisitos de migración KV.
- Respaldo real aceptado por validador corregido: 21 ofertas, 13 postulaciones, missing=[]; 21 pruebas existentes de migración/correo Admin aprobadas y regresión adicional incorporada al repositorio.
- Ensayo Bolsa con copia actual en SQLite desechable: 21 ofertas, 13 postulaciones, 14 credenciales, 9 vínculos, 3 avisos. Integridad, checksum, repetición sin duplicados y rollback de lote interrumpido confirmados. No restaura cuentas completas ni valida D1 remota.
- Ensayo Cartelera con la misma copia: 13 eventos, 8 referencias de publicación, 10 notificaciones, 12 versiones y 2 registros de despacho. Rollback e idempotencia aprobados; 0 correos enviados.
- No se restauró la base operativa y no se modificó producción. Queda pendiente ensayo completo remoto aislado y verificación del panel publicado tras despliegue Pages.

## Validador publicado: comprobación final de UI
- Tras restablecer sesión Admin se ejecutó Generar respaldo y revisar en Auditoría de staging.
- El panel mostró Respaldo actual de D1 verificado y descarga solicitada; descarga real recibida y JSON completo comprobado. Se mantiene fuente D1 con 21 ofertas y 13 postulaciones.
- Queda confirmada la corrección publicada del rechazo erróneo por tablas temporales. No se migró desde KV ni se restauró la base operativa.

## Restauración ampliada del respaldo actual: cuentas y dispositivos
- Se ensayó la captura privada actual con el adaptador de restauración 11769 en SQLite local desechable, red deshabilitada y clave sintética efímera. Sin bindings operativos ni acceso a Cloudflare remoto.
- Resultado complete=true y rollback_tested=true: 23 cuentas, 18 dispositivos, 7 vínculos de artistas, 21 ofertas, 13 postulaciones, 3 avisos, 8 mensajes, 1 identidad de correo verificada y 22 claves KV.
- temporary_authentication_restored=false: no se reviven enlaces de acceso o tokens temporales.
- Esto amplía el ensayo anterior de Bolsa/Cartelera con datos actuales de cuentas. No demuestra ingreso real en un segundo dispositivo, uso de credenciales personales recuperadas ni un ensayo en D1 remota.
- Respaldo operativo preservado; ninguna base de staging o producción fue restaurada.

## Ocultamiento reversible de Cartelera preparado
- Worker event_visibility_revision=20261106-hide-restore-1. Ruta administrativa autenticada lista publicados/ocultos y permite hide/publish con historial y transacción D1. Solo staging atómico.
- Los ocultos desaparecen de catálogos y ficha públicos; se conservan datos y fechas. Editar ocultos mantiene estado. Republicar no reenvía notificaciones ni renueva campañas.
- Admin incorpora etiqueta Oculto y botones Ocultar/Volver a publicar con bloqueo de doble envío y verificación de identidad/estado. Con Worker anterior conserva catálogo público y no muestra botones incompatibles.
- 19 pruebas Worker y 8 Admin aprobadas, incluidos permisos, exclusión pública, edición oculta, recuperación, no duplicar avisos y rollback. ZIP preparado para despliegue manual. No se ocultaron eventos remotos todavía.
- Limpieza: artista sintético ART-d01d02546d62490da9372e023934a8f0 quedó Oculto en staging; conservación y botón Publicar confirmados.
