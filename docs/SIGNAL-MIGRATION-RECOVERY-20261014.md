# Migracion de solicitudes y recuperacion antes del bloqueo

Rama: audit/public-job-status-20261012. Solo desarrollo. No desplegado, sin cambios en main ni datos reales.

## Migracion explicita

POST /api/signal-onboarding/migrate requiere Admin y D1. El cuerpo vacio o execute distinto de true devuelve una vista previa. execute:true solicita la copia. No publica senales, no borra KV y no modifica registros D1 existentes. La vista previa puede crear las tablas D1 necesarias, pero no copia solicitudes.

Resultados por ID:

- ready: valido para copiar, solo en vista previa.
- migrated: copiado mediante INSERT con conflicto protegido por D1.
- already_migrated: existe el mismo ID y JSON exacto; no se reescribe.
- conflict: ID o URL ya presentes en D1; revisar manualmente.
- needs_review: datos incompletos, derechos sin confirmar, estado en curso, duplicados en KV, fecha/URL invalida o publicacion sin identificador.

Se limita a 5000 registros por ejecucion. No acepta credenciales en la URL del stream. Preserva estado, fechas y campos originales de los registros validos. La unicidad de URL conserva el criterio historico del onboarding (minusculas y sin barra final); URLs que solo difieran en mayusculas de path pueden necesitar revision manual, no deben fusionarse a ciegas. Un error parcial puede reintentarse: nunca sobreescribe un registro ya insertado.

## Publicacion

El claim de publicacion compara el JSON completo leido con el almacenado, ademas del estado approved. Si otro administrador cambia una nota o el estado entre lectura y claim, la publicacion devuelve conflicto y no usa un snapshot viejo.

Si falla la creacion/adquisicion del bloqueo del catalogo, se intenta devolver la solicitud a approved y se responde 503. Si tambien falla D1 durante esa recuperacion, sigue siendo necesaria la recuperacion administrativa de la operacion; no se garantiza recuperacion ante caida total del almacenamiento.

## Pruebas locales

Worker real importado, SQL ejecutado contra SQLite y KV ficticio. Comprobados: Admin obligatorio, vista previa sin copias, ejecucion explicita, conservacion de approved, segunda ejecucion idempotente, conflicto de URL, duplicados ambiguos, originales intactos, ausencia de publicacion y recuperacion de fallo inyectado antes del lock. Sintaxis y 25 contratos anteriores pasan. El workflow incorpora la nueva prueba.

## Pendientes que bloquean produccion

El lease de catalogo de 120 segundos sigue sin garantizar exclusividad si una operacion lo supera. KV sigue usando arrays con escritura completa; otros endpoints administrativos tambien pueden escribirlos. Faltan pruebas concurrentes remotas D1/KV, recuperacion de escrituras parciales y reproduccion. No habilitar inscripciones ni ejecutar migracion en produccion con esta entrega.

Para staging: usar recursos independientes y primero vista previa con registros ficticios. Guardar respaldo/exportacion y revisar cada conflicto antes de ejecutar. No copiar datos personales de produccion. La UI de migracion en Admin aun no esta agregada; el endpoint es una herramienta interna de pruebas, no una nueva accion publica.
