# Bolsa: publicación, moderación y seguimiento — 18/10/2026

Se amplía el cierre de Bolsa sin modificar el Worker ni producción. Publicar bloquea envíos simultáneos, deshabilita temporalmente controles y conserva valores tras fallos. Exige success:true y un id de oportunidad para comunicar publicación, o moderation_pending para comunicar revisión. Publicado por se envía como empresa, que el Worker sí conserva; antes se enviaba entidad y se perdía. Si Contacto es un email se envía además como contacto_email para el circuito de avisos configurado; esto no prueba entrega de emails.

La consulta privada bloquea duplicados, conserva identificador/clave y exige id coincidente y estado explícito. Ya no convierte una respuesta vacía en Estado: pendiente. Campos con etiquetas asociadas, búsqueda con nombres accesibles, diálogo nombrado y estado anunciado; la clave de consulta se enmascara al ingresarla.

El comprobante suma Consultar esta postulación: completa el formulario de seguimiento con su propio id/clave, cierra la postulación y consulta por POST. No agrega la clave a la URL. Sigue disponible copiar el comprobante. Un recibo vacío no consulta otro registro.

## Pruebas

22 pruebas locales de interfaz/transporte/contrato satisfactorias (nueve nuevas en este incremento). Integración con Worker exacto f42c7f1aff03da4cec3ed98789c7b08054959e9c + SQLite/KV aislados: publicación pública y listado, conservación de empresa, dos postulaciones y claves distintas, seguimiento privado sin datos de contacto, claves cruzadas rechazadas, acceso administrativo anónimo rechazado y hashes privados. Se amplía con moderación habilitada sin proveedor: la oportunidad en revisión no aparece en el listado; una revisión anónima es rechazada; aprobar como Admin local la publica; rechazar otra no publica. Todas las operaciones son locales, con contactos example.invalid y una dirección CF de documentación. No se enviaron mensajes ni crearon registros remotos.

En Chrome staging el formulario abre dentro del shell; los nuevos nombres accesibles aparecen y pulsar Publicar con campos vacíos activa la validación nativa en Título. No se mandó una publicación completa. Captura conservada. La validación visual no sustituye publicación y postulación completas en navegador ni pruebas físicas móviles.

## Límites

Continúan pendientes el recorrido remoto completo con moderación y llegada a Admin, los avisos reales si se configuran y las pruebas de dispositivos. Los límites y escrituras KV del Worker no son atómicos; no se certifica concurrencia ni idempotencia de solicitudes cuyo resultado se pierde en tránsito. El cliente evita reenvíos simultáneos y reintentos automáticos, pero un reintento manual posterior puede necesitar conciliación. Sin pagos ni cambios de permisos o producción.

## Cierre de este incremento

GitHub Actions sobre e00b6845b8f217a4108d1395c86496ac259ab4d7: Platform integration checks 39117607520 y Job status contract checks 39117607537 satisfactorios. Tras recargar Chrome staging, la página de Bolsa conserva búsqueda con nombres accesibles y el DOM incluye el nuevo control applyReceiptTrack. Esto verifica entrega del control, no una consulta real con comprobante. No se pobló la base remota.
