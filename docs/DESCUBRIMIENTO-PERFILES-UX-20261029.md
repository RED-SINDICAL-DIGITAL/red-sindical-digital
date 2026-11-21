# Descubrimiento y búsqueda de perfiles — 29/10/2026

## Mejoras implementadas en Pages staging

- Coincidencias exactas de nombre/nombre artístico primero; luego prefijos y coincidencias parciales. Ignora mayúsculas y tildes y conserva el orden original en empates.
- No fusiona artistas homónimos ni cambia sus canales. Enlaces explícitos de canal mantienen el recorrido exacto existente.
- Regresar de un perfil conserva búsqueda, categoría y modo artista. Parámetros restringidos a una lista de categorías y modo conocidos; no se amplía a destinos externos o datos de acceso.
- Escribir invalida inmediatamente consultas previas antes del debounce, evitando respuestas atrasadas sobre la consulta nueva.
- Se evita mostrar el mismo perfil descubierto dos veces como banner y tarjeta.
- Colecciones con forma inesperada se normalizan a lista vacía en el directorio sin romper el render.

698 pruebas Pages aprobadas. Nuevas regresiones para ranking, homónimos, regreso seguro, categoría, consulta pendiente y deduplicación visual.

## Propuesta de UX

Mantener buscador universal para encontrar todo y directorio Artistas para explorar especialidades. Perfiles claros con acciones principales y retorno sin pérdida del contexto. Priorizar resultados relevantes y errores recuperables antes de sumar pantallas o más botones. No se añadieron membresías ni PRO ni se alteraron precios o condiciones comerciales.

Código guardado para staging; todavía falta comprobar estos cambios publicados y su recorrido con el proveedor real. No se certifica reproducción audible. Worker y producción intactos. Recuperación de Bolsa y vencimiento remoto de destacados siguen pendientes separados.
