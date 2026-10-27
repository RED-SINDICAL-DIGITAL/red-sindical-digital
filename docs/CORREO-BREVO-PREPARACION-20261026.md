# Correo de acceso y Brevo · estado27/10/2026 Argentina

**Recuperación real11767 aprobada según operador; recuperación pública apagada.** El último reporte confirma enlace recibido/confirmado, clave anterior revocada, acceso privado nuevo y oferta ficticia conservada sin publicación, `recovery_enabled:false`. No incluye timestamp. Versión/flags/etiquetas cotejados; Work no leyó el estado privado ni comparó el Worker remoto. Evidencia `evidence/bolsa-11767-recuperacion-real-aprobada-20261027.json`. No repetir correo, laboratorio, sandbox, DNS, dominio, remitente, APIkey o destinatario.

## Configuración y decisiones

BrevoFree seleccionado, cuota observada300/día compartida: no ilimitado ni plan pago. Una cuenta UADAV para todas las secciones con correo privado y Google opcional es la decisión de producto: `CUENTA-UNICA-Y-ACCESO-SIMPLE-20261026.md`. Los avisos habituales siguen en Mi Perfil; accesos/seguridad tienen prioridad en el presupuesto de correo. No enviar un inventario de claves permanentes.

Capturas privadas anteriores muestran dominio `correo-staging.uadavstream.com.ar` autenticado y remitente `acceso@correo-staging.uadavstream.com.ar` verificado con DKIM/DMARC. Los secretos `BREVO_API_KEY`, `BREVO_QA_RECIPIENT` y `JOB_RECOVERY_ENCRYPTION_KEY` fueron guardados por el operador; sus valores son desconocidos para Work. Conservarlos; nunca enviarlos por chat/TXT/GitHub.

## Código y evidencia

-11765 sandbox aceptado, cero correos;11766 diagnóstico real recibido. Siete fases11766-mail-lab-1 aprobadas en D1 según operador, con huellas cotejadas.11767 QA real privada completada después. Reportes históricos separados en `docs/evidence`.
- Núcleo de recuperación transaccional, snapshot cifrado inmutable y token aleatorio de256bits. La posesión del enlace recibido permite canjear después de una reserva válida incluso si se perdió la respuesta del proveedor. Aceptación no equivale a recepción; ningún error de duplicado fabrica un recibo. Clave anterior conservada hasta el canje; consumo/rotación/revocación atómicos, reintento solo para la misma nueva credencial.
- Receptor Pages11767.1 publicado en staging: borra fragmento, GET no consume, POST requiere confirmación explícita; sin storage de tokens. Guardar en Mi Perfil es voluntario con consentimiento, no vinculación por coincidencia de email. El reporte11767 no acredita la variante artística o todos los dispositivos físicos.
- HTTPS fijo Brevo, sin redirecciones, cuerpo/respuesta/plazos acotados, un destinatario QA, sin CC/BCC, campañas, adjuntos o permisos Gmail. Cuenta/correo verificado y login general todavía no implementados.
-11768 prepara captura D1 coherente, exclusión de desafíos temporales del respaldo, invalidación de pruebas previas dentro del restore faltante, y retención acotada por cron existente. No es rotación/política integral. Guía `BOLSA-11768-RESPALDO-Y-VENCIMIENTO.md`; despliegue/diagnóstico posterior ya aprobados según operador. Respaldo14/11 guardado, dos turnos sin duplicado; health11768 y rechazo HTTP404 de postulación vencida observados por Work. No repetir esa intervención.

## Trabajo restante

Verificación/consentimiento del destinatario para ofertas existentes, antiabuso y cuotas globales, antienumeración/tiempos uniformes, cuenta por correo con sesiones y migración voluntaria, rotación/recuperación integral y dispositivos. Google es opcional posterior. Mantener las dos rutas públicas503 y restore operativo apagado. No pedir una prueba de correo adicional para resolver el respaldo/vencimiento11768.

Pruebas y CI11767:227Node,25workerd y12Radio; receptor151 y CI Worker40444919105/Pages40444874718/Radio40444919072 success. Los ensayos sintéticos no se presentan como correo real o acceso remoto. Estado vigente y cinco bloques: `BOLSA-ESTADO-Y-CIERRE-20261025.md`.
