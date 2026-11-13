# Secciones visuales · integración

Se mantienen producción, Worker, KV y D1 sin modificaciones. PR 54 continúa sin fusionar.

- Descubrí tu mundo usa quince imágenes temáticas de un único atlas liviano.
- Publicidad de demostración usa el panel abstracto celeste del atlas; las creatividades contratadas conservan su imagen.
- Sin destacados editoriales, el hero tiene tres propuestas predeterminadas: descubrir, crear perfil y cartelera. Rotación cada ocho segundos, solo flechas; respeta movimiento reducido y foco de teclado.
- La búsqueda global del encabezado reemplaza al buscador repetido del pie de Inicio. La página de búsqueda conserva sus filtros.
- Radio: play decorativo en las filas de Inicio y play funcional sobre la portada del directorio.
- Admin: Cartelera ya estaba disponible. Se agrega Trabajo como fuente de filas, con selección manual, automática o híbrida. Los accesos directos preparan borradores; no escriben datos hasta Guardar cambios.
- Inicio muestra ofertas públicas en una fila. Las selecciones completas de Admin sustituyen la fila predeterminada. Una oferta seleccionada abre Trabajo y resalta la tarjeta correspondiente, sin postular automáticamente.
- Artistas, perfil artístico, búsqueda, cartelera y trabajo comparten tratamiento de tarjetas, filtros, botones y encabezados.

## Recurso visual
`assets/visual/section-worlds.webp`, generado con la herramienta integrada y comprimido a WebP. La imagen original se conserva.

Prompt: contacto fotográfico exacto de 4 columnas por 4 filas sin bordes, texto ni logos, iluminación azul/celeste. Fila 1: micrófono y guitarra; retrato de artista anónimo; producción audiovisual en vivo; estudio de radio. Fila 2: podcast; proyector de cine; creador con teléfono vertical; entradas y agenda de teatro. Fila 3: técnicos de escenario; comediante; máscaras teatrales; ballet. Fila 4: telas aéreas; manos de mago con cartas; festival al aire libre; paneles arquitectónicos celestes abstractos para publicidad. Sujetos ficticios, sin personas famosas.

## Aceptación
Las pruebas usan respuestas sintéticas y bloquean escrituras externas. Se comprueban el carrusel sin configuración, imágenes diferentes por categoría, ausencia de buscador duplicado, filtro de ofertas, selector de Admin y reproducción desde portada de radio. Incluye móvil, escritorio y TV, además de la suite responsive existente.

## Continuación 13/11
- Los enlaces sociales de la emisora se conservan en Información al simplificar Chat.
- El montaje de la presentación es idempotente: no duplica Ahora ni los controles al reiniciarse.
- La aceptación sintética de Radio comprueba que Información conserve los enlaces en móvil, PC, laptop y TV.
- Validación local: 41 pruebas de Radio, Cartelera y aislamiento aprobadas. La aceptación visual requiere CI: Chromium local no puede crear sockets en este entorno.

## Artistas · recuperación del directorio
- La revisión visual de la pasada de Radio/Cartelera/Trabajo terminó aprobada en GitHub para `689632d`.
- Fallos o respuestas inválidas del catálogo muestran Reintentar carga; no se presentan como resultados vacíos. Se conserva el fallback al segundo endpoint.
- El estado de carga oculta el botón de paginación anterior y no se reemplaza por resultados antiguos al cambiar favoritos.
- Una respuesta de catálogo no pisa una búsqueda escrita mientras carga; las cargas concurrentes comparten una petición.
- La aceptación visual prueba caída, reintento y recuperación en móvil y PC sin escrituras externas.

## Cartelera y Trabajo · accesos directos
- El resumen de filtros indica cuántos están activos y se abre al recibir filtros por URL; Limpiar filtros actualiza el resumen.
- Los enlaces internos a publicar y ver postulantes abren el formulario de Trabajo tanto al entrar como al cambiar el fragmento.
- Aceptación sintética ampliada para comprobar los filtros y la reapertura del formulario.
