# Publicidad: tarifario y territorio aprobados

El usuario aprobó las tarifas propuestas y confirmó: una pauta contratada para Santa Fe se muestra al público de Santa Fe; una pauta de Córdoba al público de Córdoba. El territorio del anunciante no determina el destino. Se conserva la elección manual de ubicación y la aproximación por IP prevista en la especificación anterior, sin exigir GPS. Si no se conoce la provincia, no se entrega una campaña provincial. La segmentación nacional no convierte campañas locales en nacionales.

## Tarifario de lanzamiento, ARS

| Producto | 7 días | 15 días | 30 días |
| --- | ---: | ---: | ---: |
| Cartelera | 5000 | 9000 | 15000 |
| Hero | 12000 | 22000 | 36000 |
| Hero + Cartelera | 15000 | 28000 | 45000 |

Por 30 días: radio destacada 20000; banner entre secciones 30000; auspicio de sección desde 50000. Convenios múltiples: cotización particular. Mismas tarifas para artista y productora. Un evento combinado consume una campaña con dos ubicaciones, no dos cobros independientes. Sin membresías ni renovación automática.

La aplicación inicial prepara doce productos con IDs estables e inactivos; repetir el guardado actualiza esos IDs en vez de crear otro catálogo. No modifica campañas previas, no concilia pagos ni activa anuncios. El precio del acuerdo debe conservarse, aunque luego cambie el tarifario.

## Inventario y recomendación

En el Admin hay tres espacios de banners: top (Superior), infeed (Entre secciones), footer (Pie). No equivalen a la especificación histórica de Inicio/Cartelera/Explorar: la navegación evolucionó y la implementación no terminó de reflejar esa intención. Se mantiene la cantidad, sin añadir pop-ups ni anuncios sobre reproductores o formularios. Superior e infeed son prioritarios; Pie es secundario. Hero y destacados de eventos son módulos promocionales propios. No se promete exclusividad. Máximo comercial previsto del hero: tres campañas, pendiente de verificación de su rotación/capacidad real antes de venderlo.

## Implementación y límites

- Oferta y Media Kit web con tarifas y condiciones aprobadas, impresión a PDF desde navegador.
- Editor de campañas con contratante, producto, importe acordado y territorio destinatario; selector de provincias argentinas.
- Comprobación de capacidad del Worker antes de guardar: impide que el servidor anterior descarte silenciosamente campos territoriales.
- API pública de campañas filtra estado, pago/bonificación, verificación de entrega, vigencia y territorio. Devuelve solo metadatos públicos; no notas privadas.
- Fechas calendario reales; vigencia de días interpretada en UTC-03 de Argentina, incluidos los extremos.
- Campañas antiguas sin territorio explícito o verificación de entrega no se difunden automáticamente.

No se desplegó este Worker, no se activó EVENT_ATOMIC_STAGING y no se modificó producción. La entrega efectiva en todos los espacios públicos, la medición de impresiones/clics, los accesos propios de productora y el circuito de cobro requieren validación independiente. Este documento cierra la definición comercial; no certifica su operación completa. No vender alcance geográfico ni resultados no verificados. Antes de activar una campaña, comprobar su aparición y el territorio exactos contratados.
