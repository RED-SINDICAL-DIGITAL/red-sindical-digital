# Recuperación: envío acotado por oferta y solicitud

## Cambio preparatorio

El motor fuente admite `dispatch(adapter, {jobId, requestId})`. La selección exige ambos identificadores válidos, sin campos adicionales. Si no coinciden en el mismo registro, devuelve `idle`; nunca consume otro correo pendiente. Una selección malformada falla antes de leer D1 o llamar al proveedor. Los usos existentes sin selección conservan su comportamiento.

## Alcance y pruebas

34 pruebas del motor aprobadas; suite Worker completa: 442 aprobadas. SQLite aislado con dos ofertas y dos solicitudes: el envío acotado conserva la otra solicitud en cola con cero intentos; la repetición no reenvía; oferta y referencia cruzadas no seleccionan nada.

Es una modificación del módulo fuente, todavía no trasladada a la copia embebida del Worker. No requiere despliegue ahora y no modifica el circuito QA en uso. Recuperación de ofertas reales sigue deshabilitada.

## Condiciones antes de habilitar ofertas reales

- Contexto propio de staging: no depender de la tabla ni de los identificadores del fixture QA.
- Política explícita de elegibilidad del correo de contacto y contacto verificado; correo de contacto y cuenta no equivalen automáticamente a autoridad sobre una oferta.
- Despacho con selección obligatoria, cuota por destinatario y presupuesto global, además de límites por IP y oferta existentes.
- Receptor que admita identificadores reales y revisiones posteriores a 2 sin ampliar el receptor QA a ciegas.
- Respuestas sin enumeración; expiración, revocación, enlace recibido con respuesta perdida, rollback, concurrentes y recuperación de respuesta del canje.
- Validación real en staging con oferta controlada; no usar contactos de terceros.

Producción intacta. La recepción real previa solo certifica el circuito sintético documentado en RECUPERACION-HTTP-QA-REAL-APROBADA-20261029.md.
