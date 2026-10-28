# Cartelera y Bolsa · revisión de recorridos en staging

Entorno exclusivo: uadav-stream-staging.pages.dev y uadav-api-staging.uadavstream.workers.dev. Sin cambios a producción ni a la rama Worker durante esta revisión. Base Pages antes del cambio: 99e568b11a956cec5ba09260a2644ae1a71f8d99.

## Evidencia remota mediante interfaz

Cartelera: se envió desde el formulario público el evento sintético «QA CIERRE 28-10 · Evento ficticio». La configuración de moderación existente lo retuvo por provider_not_configured; no se desactivó esa protección. Se aprobó exclusivamente ese envío desde Admin. ID EV-57497592-2275-4D5F-9EEA-45FDF3B517A9. Apareció en listado, búsqueda por QA CIERRE y ficha con imagen, fecha, hora, lugar y entrada gratuita. Se editó el título en Admin y se comprobó la modificación en la ficha pública. Después se dio de baja por el circuito D1 (baja lógica); Admin volvió a los dos eventos originales. No se modificaron los eventos originales. No hubo aprobación de un pago ni campaña comercial real.

Bolsa: se publicó desde la interfaz la oferta sintética «QA CIERRE 28-10 · Oferta ficticia», ID JOB-MVSGJ4DX-5E42A0872EA6. Publicación inmediata confirmada. Se envió una postulación sintética con consentimiento expreso, sin WhatsApp, sin portfolio ni perfil adjunto. La bandeja privada, mediante el acceso conservado por la propia interfaz, mostró una postulación recibida. Se cerró la oferta desde el acceso del contratante y se volvió a consultar: la postulación permaneció disponible. Tras recargar, volvió a las tres ofertas públicas originales. No se guardan claves ni contactos de personas reales en este informe.

Media Kit: se verificaron en vivo Hero, Cartelera, combinación de ambos, pauta y convenios; precios ARS aprobados; sin membresías ni renovación automática; misma tarifa para artista y productora; condiciones de verificación del pago y entrega, territorio y tres ubicaciones de banners. No se activaron cobros ni se prometen métricas no verificadas.

## Correcciones

- Pendientes y su resumen dejan de consultar las bandejas retiradas de pagos PRO y destacados PRO; se elimina el error de carga observado. Los datos históricos no se borran y no se toca el backend de compatibilidad.
- Una revisión de contenido confirmada invalida el catálogo Admin afectado, para mostrar la publicación sin recargar toda la aplicación. Un fallo o respuesta no confirmada no invalida ni anuncia éxito.
- Admin distingue revisión de contenido y aprobación comercial; deja de prometer publicación automática cuando la moderación la retiene.
- El email genérico de contacto ya no se coloca automáticamente en el campo WhatsApp al editar un evento.
- El formulario de evento explica la promoción por separado y enlaza a opciones y precios en otra pestaña para conservar lo escrito.
- Se elimina una función de presentación obsoleta y sin llamadas que todavía contenía tarifas de suscripción PRO. No se borra historial comercial.

## Validación y límites

191 pruebas específicas de interfaz aprobadas, más el script de Pendientes aprobado. Suite general anterior a añadir la nueva prueba de caché: 670 pruebas, 637 aprobadas y 33 fallos. La ejecución de comparación con los cuatro archivos de aplicación originales recuperados de GitHub reprodujo exactamente los mismos 33 fallos, sin fallos nuevos. Afectan otras áreas (reproducción, retiro de perfiles, Press Kit y Radio Studio); requieren diagnóstico separado, no se certifica toda la plataforma. La suite Worker de la revisión previa tiene 426 aprobadas y no se cambió Worker en este lote.

Correo operacional aprobado por confirmación del operador el 28/10/2026: «LISTO PUEDO VERLO ME LLEGO». El evento «QA CORREO OPERATIVO 28-10 · Evento ficticio», ID SHOW-90294B5A-33E3-4C34-A2DE-79EB075B8061, se había creado desde Admin con el destino QA expresamente autorizado. La confirmación corresponde al aviso de ese evento desde el Worker operacional de staging; no a una lectura directa de Gmail ni a una consulta independiente del recibo del proveedor. No se abrió el buzón ni se leyeron secretos. Después se dio de baja lógica únicamente ese evento y se comprobó que Admin volvió a dos publicados: SHOW-MVRBXTP5 y EV-MVF91D41. No hubo reenvío manual ni cambios de variables. La modalidad permanece qa-only; no implica correos habilitados para usuarios generales.

La interfaz de Admin ya muestra el texto corregido que separa revisión de contenido y aprobación comercial. Eso verifica remotamente esa parte del despliegue Pages. No se reejecutó la aprobación de otro evento para verificar remotamente la invalidación de caché.

Pendiente: validación visual móvil real; esta revisión remota fue de escritorio y no se dispone de emulación móvil documentada en el navegador. No se certifica producción ni cierre integral. Tras el commit debe verificarse el despliegue Pages antes de presentar los cambios como desplegados.
