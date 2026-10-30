# Carga editorial y selector del Admin · 30/10/2026

## Carga en staging
Catálogo previo 6, catálogo final 8 registros (7 videos y 1 playlist). Se conservaron los seis originales. Dos altas mediante el Admin, con proveedor YouTube, tipo video, miniatura del proveedor y descripción editorial:

- La Bella Durmiente y las Hadas Encantadas · Konex 2017 — https://www.youtube.com/watch?v=6_rw7PdAvgo — categoría Compañía de danza. Descripción identifica archivo histórico de 2017, no función vigente ni venta de entradas.
- Cirque du Soleil · Especial de 60 minutos: La Nouba, Varekai y Quidam — https://www.youtube.com/watch?v=mYvs4Avhgp0 — categoría Circo. Descripción identifica selección audiovisual, no anuncio de funciones actuales.

Fuentes de esta tanda ya observadas en las verificaciones previas: biblioteca automática de Fundación Konex y recomendación del reproductor de Cirque du Soleil. El buscador web externo falló y la consulta HTTP directa a la API pública devolvió 403; no se incorporaron candidatos de humor/magia/podcasts sin verificar. Detectar plataforma confirmó proveedor/tipo, sin devolver título ni acreditar autoría adicional.

Ambos registros se añadieron a la fila Escena y movimiento, que pasó de 3 a 5 referencias elegidas, manteniendo modo híbrido, máximo 6 y consulta Fundación Konex ballet. Se guardó la portada mediante Guardar cambios y se verificaron los dos botones públicos. El ballet abre el iframe del ID esperado; no se certifica reproducción audible en el navegador cloud. No se crearon ofertas, eventos, testimonios ni campañas ficticias.

## Corrección de código
Crear, editar o eliminar contenido invalida también sectionContent y sectionCatalog, además de contentItems. El selector de portada se vuelve a cargar al regresar, sin recargar toda la aplicación ni perder borradores de landing/secciones. Mutaciones fallidas conservan la caché para reintento.

753/753 pruebas CJS aprobadas. Producción y Worker intactos.

## Atribución final y validación del selector
El reproductor del ballet identifica el canal publicador Matías Sanchez de Bustamante, UCrGm7R8AJiqZTC-W5LT3NaQ. No es una publicación del canal de Fundación Konex. Se corrigió el título final a La Bella Durmiente y las Hadas Encantadas · Registro Konex 2017 y la descripción acredita al publicador exacto. El título del video original menciona Konex 2017 y el reproductor informa duración 1:06:00.

El especial de Cirque du Soleil identifica el canal UCPiWIjwDZQo3UobMqvi4ggg, nombre Cirque du Soleil, y título ESPECIAL DE 60 MINUTOS #10. Su duración visible es 1:18:17; Especial de 60 minutos es el nombre de la serie, no una duración exacta certificada por UADAV.

Después de desplegar el arreglo, se editó ese registro desde Videos y música y se regresó a Portada sin recargar el Admin: el selector mostró el nuevo título, confirmando invalidación de caché en vivo. Se canceló el diálogo de sección porque no hacía falta volver a publicar referencias: conservan el mismo ID.
