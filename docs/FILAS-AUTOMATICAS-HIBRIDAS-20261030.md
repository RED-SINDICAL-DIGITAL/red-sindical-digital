# Filas automáticas e híbridas de contenido — 30/10/2026
Solo staging. Producción y Worker intactos.

## Implementación
En Admin, Cómo se completa ofrece Elegir contenidos, Buscar automáticamente y Elegir y completar.
El campo de búsqueda aparece únicamente cuando se utiliza. La selección manual se conserva al cambiar de modo.
Home admite filas manuales, automáticas e híbridas de videos/contenido/mixto.
La búsqueda usa el catálogo público y el servicio de búsqueda existente. En híbrido los manuales van primero.
Se deduplica por identidad del video o playlist; consultas equivalentes comparten una promesa.
Búsquedas sin resultados, en curso y fallidas se distinguen. Los fallos conservan los resultados disponibles y ofrecen Reintentar.
Las filas manuales se muestran antes de esperar fuentes automáticas. El renderer reutiliza filas que no cambiaron.
Las colecciones base se resuelven solo cuando son públicas y existen; no se amplía la búsqueda fuera de ellas.
Se conserva el canal de origen cuando viene informado; si falta, se muestra YouTube y no UADAV como supuesto autor.

## Verificación
Suite Pages final: 727/727 aprobadas. Scripts inline de Home y Admin comprobados antes del despliegue inicial.
Pruebas nuevas: prioridad manual, deduplicación, fallos, carga inicial, consultas compartidas, filtrado del catálogo completo, acentos, límites de colección, registros privados y etiquetas de fuente.
Prueba real desde Admin: SEC-MVUKJ092-BZI6, Escena y movimiento, pasó de manual a hybrid, query Fundación Konex ballet, máximo 6.
Se conservaron sus tres referencias manuales y su orden.
La web mostró los tres manuales primero y tres resultados adicionales al final, seis identidades diferentes.
El modo exclusivamente automático cuenta con pruebas automatizadas; no se creó otra fila pública solo para aparentar más contenido.

## Alcance pendiente
Filas de artistas, radios y eventos aún requieren integración específica. Colecciones con reglas dinámicas no quedan certificadas por esta entrega.
La carga editorial de la biblioteca conserva cinco videos y una playlist; los resultados automáticos no se copian al catálogo ni crean cuentas.
Las imágenes artísticas elaboradas y la validación física de miniaturas externas siguen pendientes.
No se habilitaron pagos, campañas nuevas, recuperación general de ofertas ni cambios productivos.
