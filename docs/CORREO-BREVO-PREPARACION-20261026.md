# Correo de acceso y Brevo · estado27/10/2026

**11769 desplegado y correo de cuenta habilitado:** estado público15:50Argentina instalado/enabled/qa_verification/qa_login true, después de la confirmación general del operador. No repetir esas pruebas. Evidencia `evidence/bolsa-11769-despliegue-correo-observado-20261027.json`. La QA privada de oferta11767 y el respaldo/vencimiento11768 ya fueron aprobados por el operador. No repetir sus correos, laboratorios, cron, Brevo, dominio, DNS, remitente, APIkey o secretos. La secuencia vigente es [BOLSA-11769-ENTREGA-INTEGRADA.md](BOLSA-11769-ENTREGA-INTEGRADA.md).

## Configuración conservada

BrevoFree seleccionado, cuota observada300/día compartida, no ilimitado ni plan pago. El circuito de cuenta11769 usa un presupuesto global atómico de240mensajes/díaUTC, límites por IP/dirección, tres reintentos idénticos y envío en segundo plano. Los usos externos de esa cuenta Brevo también consumen su cuota; no prometer entrega ilimitada.

Dominio `correo-staging.uadavstream.com.ar` y remitente `acceso@correo-staging.uadavstream.com.ar` verificados según capturas anteriores. Los secretos `BREVO_API_KEY`, `BREVO_QA_RECIPIENT` y `JOB_RECOVERY_ENCRYPTION_KEY` fueron guardados por el operador; Work desconoce sus valores. Conservarlos, nunca compartir por chat/TXT/GitHub. Una cuenta UADAV para todas las secciones con correo privado; Google opcional posterior. Avisos habituales en Mi Perfil, sin campañas.

## Integración11769

- Nueva identidad estable con dirección AES-GCM, índice HMAC, revisión y consentimiento registrado. No usar un contacto público como prueba de cuenta/oferta. Cambiar email requiere confirmar el nuevo y conserva el anterior hasta entonces.
- Outbox cifrado, mensaje/destinatario inmutables, idempotencia, caducidad15minutos y un solo canje. Verificación desde la cuenta actual y canje desde esa misma cuenta; login posterior desde otro dispositivo. Cuenta nueva solo después de prueba. Misma candidata permite reconciliar una respuesta perdida.
- Revalidación de autoridad/revocación dentro del lote D1; dispositivos, borrado, cuotas y cambios de contacto probados. Respuesta202 uniforme con espera acotada, sin revelar existencia de una cuenta. Token en fragmento, borrado temprano, confirmación POST, no hay claves permanentes en el mensaje.
- Preparar es Admin, exacto staging, fingerprint de esquema y receptor Pages11769.1. No manda correo ni habilita acceso general. Solo el QA existente puede recibir hasta confirmar e ingresar en la misma cuenta/revisión; después habilitación explícita de staging. El frontend y backend controlan ambas condiciones. Pausar cancela pendientes.
- Nuevos datos permanentes incluidos en export; desafíos, outbox y activación excluidos. Retención acotada en el cron existente. Rotación avanzada conserva su candidata antes de mutar, con control de versión y reconciliación; no se depende de un secreto generado solo después de revocar.

## Evidencia y pendientes

11765 sandbox aceptado sin envío;11766 diagnóstico real recibido; siete fases11766-mail-lab aprobadas;11767 recuperación real de oferta ficticia cerrada completada.11768 captura/avisos aprobados, health y rechazo404 sintético de postulación vencida observados por Work. Evidencias históricas en `docs/evidence`.

11769:294Worker,186Pages,32controles workerd y12Radio locales. SMTP y D1 sintéticos; no nuevo correo real o SQL remoto por Work. Una lectura pública Agencia Beat no envió correo o publicó trabajos. Despliegues y dos propósitos de cuenta ya acreditados por estado remoto. El operador indicó ensayo/recorrido completados y aportó después JSON complete14/14/rollbacktrue,1identidad de correo y22claves KV; ensayo aprobado para su contexto. No repetir correos, respaldo o restauración. El alcance físico permanece como reportado, sin afirmar accesibilidad exhaustiva. El flag histórico email_automation de health no es el estado del nuevo circuito: consultar /api/access/email/status. No repetir11767 ni habilitar por ese resultado el acceso general.

Los dos endpoints antiguos por clave de oferta siguen503. Los trabajos guardados se recuperan entrando a la cuenta por su identidad verificada. Restore operativo permanece apagado; Google no implementado ni requisito artificial para cerrar Bolsa. Estado de cierre: `BOLSA-ESTADO-Y-CIERRE-20261025.md`.
