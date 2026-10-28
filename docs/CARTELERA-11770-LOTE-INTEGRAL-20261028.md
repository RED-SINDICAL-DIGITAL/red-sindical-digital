# Cartelera 11770 · lote integral local

Sustituye los pendientes locales descritos en revisiones anteriores, sin certificar un despliegue remoto.

- **Importación:** los dos endpoints pasan por D1 cuando está habilitado el circuito experimental. Referencias deterministas; lote completo validado antes de escribir; rollback ante error; reintento sin duplicados; protección de eventos eliminados, moderados, gestionados o reclamados y condiciones de destacados pagos. Máximo 200 filas por lote. Fuente HTTPS pública. Importar no restaura un backup privado.
- **Mantenimiento:** operaciones D1 atómicas. Nunca sustituye un evento actual por una copia vieja de KV. Vence promociones y fuentes externas; respeta la última función y el final del día argentino. Repetir la ejecución no duplica cambios. Cron propio separado del de Bolsa, desactivado por defecto.
- **Destacados pagos:** actualización canónica con historial y control de concurrencia; rechaza vencimiento inválido o pasado. La publicación básica y la aprobación de pago siguen separadas.
- **Avisos:** se reutiliza el adaptador Brevo instalado. Modo exclusivamente QA, requiere activación explícita y destinatario configurado; no envía al resto de contactos. Claim por aviso para impedir despachos simultáneos; aceptación durable; reintento limitado ante rechazo confirmado; respuesta incierta o interrupción del envío queda en revisión, sin reenvío automático. Se cancelan avisos de eventos que ya no estén publicados. No se enviaron correos reales en estas pruebas.
- **Respaldo y restauración:** exportación incluye referencias de publicación y ledger de avisos. Ensayo en SQLite descartable de eventos, referencias, historial, avisos y ledger; rollback, reintento y respuesta perdida. Rechaza bases ajenas y checksum inválido; no restaura credenciales ni tablas de cuentas. Un envío interrumpido se restaura como incierto. No está montado como restauración operativa ni habilita envíos.
- **Bolsa:** no se modificó su circuito ni su cron. Su prueba estricta de aislamiento del cron sigue aprobada.

Validación final: **415 pruebas del Worker y 173 de interfaz aprobadas**, sin fallos ni pruebas omitidas en esas ejecuciones. Se verificó que el archivo de release coincide byte por byte con `worker.js` y que los módulos incorporados coinciden con sus fuentes probadas.

Entrega: `releases/worker-UADAVSTREAM-V11.7-11770.js`, instrucciones y manifiesto. El circuito experimental, el nuevo cron y los avisos no se activan al descargar el paquete. Pendiente: validación con D1 real aislado en Cloudflare y comprobación de recepción real del nuevo aviso. Para habilitar avisos generales a otros destinatarios, hará falta completar la política de destinatarios verificados; este candidato no lo permite. Producción no fue modificada.
