# Panel de recuperación: cupo, prueba activa y vencimiento

29/10/2026. Rama Worker staging exclusivamente.

## Cambio

La consulta Admin calcula en lectura el cupo global de dos pruebas por día y la existencia de una prueba activa usando los mismos criterios que la reserva transaccional. Informa `start_blocker` (`daily_limit`, `active_trial` o null), `daily_remaining`, `daily_reset_at` y revisión `11770-qa-status-2`. La reserva sigue siendo atómica; un estado leído no garantiza cupo ante concurrencia.

El panel muestra vencimiento y fecha límite; el cupo diario indica cuándo reinicia en hora argentina. Bloquea preparar una prueba nueva si no se permite, pero conserva la continuación de una prueba propia ya preparada sin envío. Una prueba aprobada permanece como aprobada incluso si se agotó el cupo para crear otra.

Se permite copiar diagnóstico pendiente con campos explícitos, sin correo, token, clave o identificadores de oferta/solicitud. Consultar no envía ni modifica datos. No se aumentó el cupo ni la duración del enlace.

## Validación

447 pruebas Worker aprobadas. Casos nuevos: cupo agotado con enlace vencido; prueba activa que bloquea una nueva; continuación de prueba propia; diagnóstico pendiente sin secretos; cuota y estado calculados sin crear pruebas ni correos en la consulta.

## Despliegue pendiente

Archivo completo: `releases/worker-UADAVSTREAM-V11.7-11770-qa-status.js`. Desplegar solo en `uadav-api-staging`, conservando conexiones y variables. No requiere migración. Incluye envío acotado, vencimiento exacto y traducción correcta de errores anteriores.

La recuperación nueva sigue sin aprobar. La recepción en Spam fue confirmada por el operador, pero el canje falló y luego el enlace dejó de estar disponible. Esta mejora informa el estado actual; no prueba retrospectivamente la causa original. No se envió correo nuevo desde esta modificación. Recuperación de ofertas reales deshabilitada. Producción intacta.

SHA256: `b3cbbeb5ce99ae5329f9d2d1d3a5eb8e4b2851691935699f9c187575062bf49f`.
