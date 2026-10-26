# Bolsa 11763 · ensayo con fecha real · preparado el 26/10/2026

## Estado

Procedimiento preparado, **oferta todavía no creada y ensayo no ejecutado**. El cron y su recibo se comprueban por separado. Un turno exitoso con cero cambios no demuestra el cierre de una oferta ni la entrega de un aviso.

## Preparación mediante la interfaz normal

El operador usa su cuenta QA existente y conserva sus comprobantes privados; no envía claves por chat o TXT. Crear una oferta nueva de staging evita alterar los registros previos. La publicación genera un acceso privado nuevo, por lo que el operador completa esa publicación y guarda el comprobante.

En Bolsa staging → **Publicar una oportunidad gratis**, usar:

- Título: **QA 11763 · Vencimiento real · NO CONTRATAR**.
- Ciudad: **Rosario · PRUEBA**.
- Descripción: **Oferta ficticia para probar el vencimiento automático de UADAV STREAM staging. No hay contratación ni remuneración real.**
- Contacto: identificador de prueba del operador; no datos de terceros.
- En **Más detalles (opcional) → Publicación visible hasta**, elegir **26/10/2026** si se prepara durante ese día de Argentina. El campo **Fecha** es distinto y no determina este vencimiento.
- Guardar voluntariamente la oferta en **Mi Perfil → Mis trabajos** de la cuenta QA. Conservar el ID real generado y el comprobante privado; registrar el ID en el informe, sin inventarlo.

Esta fecha es válida hasta el final del 26/10 en Argentina. Si la preparación ocurre otro día, elegir el día actual permitido por el formulario y registrar esa fecha; no usar una fecha pasada. El primer instante de vencimiento de este caso sería el **27/10/2026 a las 00:00 de Argentina**, equivalente a `2026-10-27T03:00:00Z`.

## Comprobaciones necesarias

1. Antes de vencer: publicación pública inmediata, guardado voluntario confirmado y una postulación ficticia recibida con consentimiento explícito. El operador conserva también ese comprobante. Comprobar el aviso previo automático en la cuenta vinculada y una repetición sin duplicados.
2. Después de vencer: deja de aparecer en el listado y el servidor rechaza nuevas postulaciones aunque un formulario haya quedado abierto antes. Conservar la candidatura previa, su estado y su consentimiento.
3. Esperar un evento real posterior del cron. La cuenta vinculada recibe un único aviso posterior; el informe Admin confirma la revisión. No cambiar el reloj, fechas de registros previos o metadata del programador para forzar el resultado.
4. En el turno siguiente, confirmar ausencia de avisos duplicados. Una oferta QA ya cerrada u oculta sigue en ese estado. El control entre una segunda cuenta y perfiles artísticos se mantiene como otra puerta de privacidad pendiente.

Actualizar el registro con ID de oferta y candidatura, fecha límite, horas del evento, texto visible del aviso y capturas sin claves o datos personales. No aprobar fases solo por haber escrito este procedimiento. El respaldo privado existente conserva su identidad y no se publica en GitHub.
