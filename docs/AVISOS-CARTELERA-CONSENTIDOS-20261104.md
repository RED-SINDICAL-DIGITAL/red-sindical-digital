# Avisos consentidos de Cartelera · candidato staging · 2026-11-04

## Estado
Código implementado, pruebas locales aprobadas: Worker 470/470, Pages 787/787. La prueba integral usó Worker completo, SQLite y transporte Brevo simulado. Falta recepción real del circuito general después de desplegar y activar exclusivamente en staging. No se cambió configuración remota ni producción.
Worker: releases/worker-UADAVSTREAM-V11.7-11770-cartelera-consentimiento-20261104.js
SHA256: 41a04a4e06f40711ef6094e521fe2d8bd4aa2df8d7c5c72e948858f4cb7e37cc
Revisión de capacidades: mail_revision=11770-cartelera-consent-20261104.

## Uso
Publicar sin cuenta y sin avisos conserva su comportamiento. La opción de recibir avisos es voluntaria, sin publicidad o suscripciones. Solo aparece cuando el Worker confirma soporte activo de avisos consentidos en staging. Al elegirla, el servidor verifica la cuenta autenticada, su correo verificado y coincidencia con el contacto del evento; no confía en cuentas ni autorizaciones enviadas dentro del JSON. Un fallo permite desmarcar avisos y publicar normalmente.
Consentimiento y revisión de identidad se guardan en el aviso dentro de la transacción atómica de publicación. No se agregan identificadores privados a la ficha pública. La referencia idempotente incluye la autorización: otro actor no puede apropiarse de una publicación repitiendo su referencia con otra cuenta.

## Envío
Modo explícito CARTELERA_MAIL_STAGING=verified-only; qa-only conserva el destinatario de pruebas. El modo nuevo requiere CARTELERA_MAIL_START_AT como ISO UTC con milisegundos (ejemplo de formato: 2026-11-04T18:00:00.000Z), nunca una fecha futura. El despachador excluye avisos previos a esa fecha, de más de 24 horas, sin consentimiento o con fecha futura. No se vacía ni borra la cola histórica.
Antes de enviar revisa cuenta no eliminada, misma revisión y clave de cifrado de identidad, correo verificado vigente, evento publicado y contacto sin cambios. Si cambia la autorización, cancela el aviso sin enviar. Despacha hasta 5 por turno con presupuesto atómico de 20 intentos diarios. Conserva reserva exclusiva, idempotencia estable y estado incierto sin reenvío automático. El webhook genérico excluye estas plantillas cuando Cartelera usa D1 atómico para que no eluda la política.
No se hacen migraciones nuevas ni cambios de tarifas, pagos, ofertas o destacados.

## Despliegue en dos pasos
1. Desplegar el Worker completo SOLO en uadav-api-staging; conservar CARTELERA_MAIL_STAGING=qa-only, JOB_RECOVERY_HTTP_STAGING=public y el resto de variables existentes.
2. Esperar Pages. Admin → Auditoría → Respaldo avanzado → Comprobar avisos de Cartelera. GET de solo lectura, requiere Admin y hostname de staging.
3. El control informa D1 atómico, publicación inmediata, cron, ausencia de mantenimiento, proveedor, correo de Mi Perfil habilitado y fecha de inicio. Si esta falta, muestra suggested_start_at calculado por el servidor. No copiar claves al chat.
4. Conservar el respaldo privado. Solo con todos los demás requisitos aprobados, establecer CARTELERA_MAIL_START_AT con la fecha sugerida actual y CARTELERA_MAIL_STAGING=verified-only. Desplegar únicamente staging y repetir el control.
5. Prueba real: ingresar con Mi Perfil y correo verificado del operador, publicar un evento ficticio claramente identificado como prueba sin cobros y con consentimiento; esperar el turno 7/22/37/52 de cada hora. Confirmar recepción y un solo envío, consultar el evento y verificar que no se active un destacado pago. Ocultarlo al concluir.
6. Si falla, volver a qa-only. Revisar D1 y el recibo del proveedor antes de reenviar un aviso incierto. No cambiar claves de correo/cifrado durante la validación.

## Pruebas
Worker completo: cuenta verificada real en SQLite, rechazo de dirección ajena y cuenta anónima, publicación atómica con metadata privada, un envío en cron y cero duplicados en otro turno; sin consentimiento no envía; cambio de revisión cancela. Política: corte temporal válido y ventana de 24 horas. Cola: historial y falta de consentimiento excluidos; autorizaciones retiradas canceladas; webhook genérico sin bypass. Interfaz: consentimiento no preseleccionado, cabecera de cuenta solo al elegir avisos, cambio de cuenta durante CAPTCHA bloquea envío y visitante anónimo puede desmarcar avisos. Admin solo consulta y explica fecha pendiente.
