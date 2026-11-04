# Carga editorial y revisión visual · 4/11/2026

## Contenido cargado desde Admin staging
El lote content/staging/cartelera-editorial-20261104.json se revisó e incorporó con la UI de Importar y exportar. Resultado confirmado: imported 3, created 3, updated 0, skipped 0.
- Manon: EV-EXT-1CD42885ECF220DC3D699E0774D0B1E5. Fuente https://teatrocolon.org.ar/produccion/manon/ ; nueve funciones oficiales del 5 al 15 de noviembre, imagen oficial y enlace de información/entradas.
- Ars Nova, 50.º aniversario: EV-EXT-8AFE09149E9743833882F258E0948806. Fuente https://teatrolacomedia.gob.ar/espectaculo/ars-nova-50-aniversario/ ; 6/11/2026 20:00, La Comedia, Rosario, entrada gratuita.
- Música de acá: EV-EXT-E7DD8B847EE4B797D95BA9245D9EAE8E. Fuente https://teatrolacomedia.gob.ar/espectaculo/musica-de-aca-3/ ; 7/11/2026 20:00, La Comedia, Rosario, entrada gratuita.
Texto editorial resumido, imágenes enlazadas desde las fuentes y datos contrastados el 4/11. No representan contratación, convenio, recomendación paga ni producción de UADAV. Sin destacado pago y sin inventar precios o disponibilidad.
Las tres imágenes se verificaron cargadas en el navegador: Manon 1920x1080, Ars Nova 1024x547, Música de acá 1024x546.

## Correcciones encontradas al cargar
La normalización del Admin conservaba insuficientemente los datos de eventos. Ahora mantiene URL de origen HTTPS validada, fuente, identidad externa y funciones, tanto para JSON como para planillas; rechaza fuentes faltantes y funciones malformadas antes de confirmar.
La ficha individual interpretaba una página web de origen y un identificador externo como video. Ahora distingue medios explícitos, identificador YouTube válido y fuente editorial. Añade enlace Fuente oficial, conserva el reproductor para medios válidos y usa Información oficial en eventos gratuitos.
Las recomendaciones excluyen eventos pasados usando el componente de fechas compartido con Cartelera. Fechas de la ficha legibles en español y margen al saltar a la agenda para que el encabezado no tape las tarjetas.
793/793 pruebas de interfaz aprobadas. No requiere Worker nuevo ni cambios de variables. Cambios de Pages guardados en rama staging, sin modificar producción.
El navegador utilizado permite revisión de escritorio; no se certificó una prueba física nueva en móvil, tablet o TV durante esta carga. El lote es una primera selección de Cartelera; no implica haber cargado todas las secciones de la plataforma.
