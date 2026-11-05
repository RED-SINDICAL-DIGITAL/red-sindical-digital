# Diagnóstico staging — 2026-11-05

La rama conserva BUILD 11770 aunque recibe cambios posteriores. Ese número aislado no permite decidir si el Worker publicado está actualizado.

`email_automation` informa únicamente EMAIL_AUTOMATION_URL; `queue` informa el binding UADAV_NOTIFY. Sus valores false no significan que Brevo ni las colas D1 estén deshabilitados.

El health agrega diagnostics_revision, advertising_revision y creative_revision, y distingue los bindings antiguos de la presencia de la clave Brevo. Presencia de configuración no acredita habilitación ni entrega. Se conservan los campos existentes por compatibilidad.

Validación local: 30 comprobaciones dirigidas aprobadas en health, segmentación territorial, creatividades, política pública de Bolsa, recuperación pública, preparación y consentimiento de Cartelera y acceso local de cuentas. La prueba territorial ahora usa un banner completo conforme a las validaciones de creatividades actuales.

No se modificaron productos, campañas, pagos ni datos remotos. No se desplegó producción. El cambio del Worker requiere despliegue en staging para estar disponible en health.
