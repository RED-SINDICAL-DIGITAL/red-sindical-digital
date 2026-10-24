# Bolsa 11760 · QA real de planillas · 24/10/2026

Únicamente staging. No cambió el código Worker `83f8cb307260d0d105f1ff6d7ed9f6a14a139006`, ni el esquema, variables o producción. Pages tiene la implementación y el detalle técnico en `docs/BOLSA-11760-IMPORTACIONES-ADMIN.md` de su rama `audit/continuidad-demo-20261019`.

## Implementación publicada

- Pages `9967c6c038f8ad0725ce4825adbd31f3a0b8d339`, árbol `048e0b1f0b1f9a141e39e46c05d52e77b5213736`; verificado por manifest público y hash del lector local.
- CI `40143976001` aprobado: 120 casos focalizados de Bolsa y control de importación/exportación. Nuevos casos reales de lectura cubren CSV UTF-8 con acentos, BOM, separador punto y coma, ceros iniciales y fechas de Excel con épocas 1900/1904.
- La interfaz dejó de enviar Bolsa a `admin/import`: normaliza origen/enlace externos y usa `admin/federated/import`, en lotes de hasta cinco. La URL evita duplicados. Nuevas ocultas requieren revisión; las existentes conservan su visibilidad. La vista previa y la confirmación son obligatorias; un resultado incierto detiene los lotes siguientes sin reenvío automático.
- La primera revisión CSV falló antes de escribir por conversión de fechas y acentos. Se corrigió y se repitió el mismo archivo con el resultado esperado. Admin incluye la distribución oficial 0.20.3 de SheetJS localmente, con licencia y hash registrados; no depende de descargar la versión antigua del CDN npm.

## Recorrido comprobado

1. CSV de oferta ficticia oculta: el servidor confirmó una nueva oferta; el catálogo siguió con las cinco originales y no mostró la ficha.
2. Mismo archivo otra vez: cero nuevas y una actualizada. No aumentó el número de ofertas.
3. Segundo CSV, publicación explícita y fecha 2026-11-23: una nueva oferta pública, etiqueta «Convocatoria externa» y botón «Ver convocatoria». El navegador abrió el enlace de QA esperado en otra pestaña.
4. Admin ocultó la segunda ficha; las dos están ocultas, sin borrar datos. Son `JOB-EXT-51ABD6B4` y `JOB-EXT-8BFE6412`. La Bolsa pública volvió a las cinco ofertas originales.

[Evidencia de las fichas de QA ocultas](evidence/bolsa-11760-dos-importaciones-ocultas-20261024.jpg).

## Respaldo posterior

Worker 11760, almacenamiento D1: **11 ofertas, 10 postulaciones, 3 vínculos, 1 marca de aviso próximo y 1 anuncio de ese aviso**. Los 21 registros del export lógico coinciden con `job_store_records`, con credenciales separadas consistentes. La oferta nativa de QA sigue cerrada, su candidatura sigue recibida y la lectura del aviso persiste. Las dos URLs externas son únicas; los identificadores de solicitud coinciden con su huella y no tienen credenciales privadas de contratante.

Archivo privado: 258.655 bytes, SHA-256 `f3fcfe8f2960be20de3341c36bdc16fa13990bd758cbae9bfeabb2375df904d2`. Guardado como **versión 3 del mismo respaldo**, preservando versiones anteriores. No está en git. El export declara integridad completa; siguen faltando dos tablas opcionales de otros módulos, sin convertir este control de Bolsa en prueba de restauración de toda la plataforma.

## Límites y siguiente etapa

No se comprobó scraping, extracción HTML, vigencia de ofertas reales de terceros, ejecución programada, aviso remoto posterior al vencimiento, concurrencia HTTP independiente, segundo dispositivo o restauración en una base desechable. La recuperación por correo permanece deshabilitada. Algunas validaciones de fechas del Worker previo aún comparan con UTC y deben armonizarse con el día de Argentina; este cambio de Pages no lo corrige ni exige un despliegue Worker nuevo.

Las guías pública e interna se actualizaron sobre los circuitos ya comprobados, sin prometer correo o automatización no verificados. Bolsa todavía no cumple su puerta de salida completa y Cartelera permanece después.
