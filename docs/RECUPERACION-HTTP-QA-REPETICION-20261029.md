# Repetir QA HTTP sin reutilizar una aprobación histórica — 29/10/2026

Observado en staging desplegado: capabilities http_qa_enabled=true/public_job_key_recovery_enabled=false; ingreso privado correcto. La pantalla mostró una prueba histórica completa y bloqueó el botón incluso después del consentimiento. No se creó una oferta nueva ni se envió correo en esta revisión.

Corrección: usar can_start del servidor para permitir otra prueba completa/expirada, exigir nuevamente consentimiento y generar una referencia nueva antes de solicitar/enviar. Una reserva vigente sigue bloqueada; no hay reenvío automático ni se cambian los límites de 2 pruebas diarias y 1 reserva por prueba.

Trazabilidad: solo una solicitud HTTP que tenga outbox confirmado marca mail-http-qa:<request_id> en metadata sin secretos. El resultado privado y el resultado seguro copiado incluyen http_qa_flow. Una prueba histórica sin esa marca informa false; no sirve para certificar la integración nueva. El estado completo exige las verificaciones transaccionales previas y canje real.

439/439 pruebas Worker aprobadas. Nuevas pruebas: repetir una prueba histórica crea una referencia diferente y conserva una sola reserva; resultado seguro distingue flujo HTTP; integración real SQLite/proveedor simulado confirma http_qa_flow=true al completar el recorrido nuevo.

Desplegar releases/worker-UADAVSTREAM-V11.7-11770-recovery-http-qa-2.js solo en uadav-api-staging. Conservar JOB_RECOVERY_HTTP_STAGING=qa-only y las demás variables, secretos, bindings y cron. No requiere nuevo despliegue Pages. Recargar /qa/recuperacion-oferta y repetir ingreso seguro. Todavía falta recibir y canjear el correo de ESTA prueba nueva. Producción sin cambios.

SHA256: 519fd7abe95e09f3230e1907d11a1a7f137911419f29fb4d00bd1f10b427502e
