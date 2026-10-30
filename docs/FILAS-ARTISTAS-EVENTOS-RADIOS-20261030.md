# Filas de artistas, eventos y radios — 30/10/2026
Solo staging. Worker y producción intactos.

## Cambios
El editor de secciones incorpora Qué muestra la fila: biblioteca, artistas, eventos o radios.
El selector ofrece únicamente el catálogo del tipo elegido. Cambiar de tipo conserva el borrador de cada tipo, su diseño y su consulta.
Perfiles adoptan diseño circular; eventos y radios tienen proporciones propias. Imágenes faltantes muestran una inicial legible.
Los IDs de referencia llevan un prefijo por tipo; una coincidencia de ID entre evento y artista no mezcla registros.
La web vuelve a resolver cada referencia contra el catálogo público actual, excluyendo registros ocultos, privados, eliminados o deshabilitados.
Destinos internos generados por tipo, sin ejecutar HTML ni aceptar redirecciones del registro.
Si una fila automática sin filtro incluye el catálogo público completo, sustituye el bloque estándar equivalente. Una fila parcial o fallida no lo oculta.
Admin muestra Automático, en lugar de 0, para filas que se completan sin ítems manuales.

## Pruebas y circuito real
Suite Pages 735/735; suite enfocada 21/21; sintaxis de scripts comprobada.
Se conservó una selección de video al cambiar a Artistas y volver a Biblioteca en el formulario real.
Desde Admin se crearon y publicaron:
- Artistas para descubrir, automática, diseño circular: 1 perfil público.
- Cartelera para descubrir, automática, diseño evento: 2 fichas públicas.
- Radios para acompañarte, automática, diseño radio: 3 emisoras existentes.
Se mantuvo Escena y movimiento con 6 contenidos (3 elegidos y 3 resultados automáticos).
Los bloques estándar correspondientes quedaron ocultos por sustitución, sin duplicación.
La tarjeta de Masterboy abrió el perfil y se confirmó su título. La tarjeta de Beethoven/Brahms abrió su ficha y se confirmó su título. Se regresó a Explorar en ambos casos.
Se verificaron los href internos de las radios. No se iniciaron las emisiones marcadas NO REPRODUCIR.
Ancho 390: viewport interior 373 y scrollWidth 373. Ancho 320: viewport interior 303 y scrollWidth 303. Cuatro filas presentes, tres espacios publicitarios. No equivale a hardware móvil real.

## Límites
La fila de eventos usa la página pública de hasta 20 registros del feed existente; no se certifica paginación integral de ese catálogo.
Las filas no crean artistas, eventos ni radios: organizan registros públicos existentes. No se asignaron propietarios ni se publicaron pagos ficticios.
Las miniaturas externas aún requieren verificación física; las imágenes elaboradas siguen para la próxima etapa visual.
No se certificó reproducción audible ni pagos, recuperación general o finalización de toda la plataforma por estas pruebas.
