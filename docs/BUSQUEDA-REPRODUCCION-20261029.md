# Búsqueda y reproducción — 29/10/2026

Rama Pages staging. Se corrigió la normalización de resultados YouTube con identificador de 11 caracteres sin campo provider: ahora obtienen URL e identificadores reproducibles. Se conserva el proveedor explícito de otras fuentes.

Cargar más valida el cuerpo y el cursor antes de modificar resultados; ante una respuesta malformada conserva contenido y cursor y ofrece reintento. Respuestas atrasadas no reemplazan una búsqueda posterior. Se eliminó una carga duplicada del módulo de descubrimiento.

684/684 pruebas Pages aprobadas, con cuatro regresiones nuevas para reproducción, paginación inválida, recuperación del reintento y consultas concurrentes. Esto valida código y pruebas locales; no certifica reproducción audible ni prueba en equipo físico del operador.

No se cambió Worker ni producción. Recuperación QA por correo sigue pendiente, separada de esta mejora.
