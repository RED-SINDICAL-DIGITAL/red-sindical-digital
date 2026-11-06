# Modelo vigente y primera implementación

Reemplaza los tarifarios anteriores y la idea de USD 5/mes. Perfil, publicación común y acceso a oportunidades gratuitos. Publicidad y promociones se cotizan con administración central Santa Fe. Transferencia a cuenta indicada del Banco Municipal de Rosario; nunca activar por una foto de comprobante. Sin CBU, alias ni destinatario de correo inventados.

Hero: conserva contenidos editoriales, sin limitar su cantidad; inserta como máximo un anuncio después de los primeros cuatro contenidos disponibles, o al final si hay menos. El anuncio se identifica como publicidad. No se crean campañas ficticias para demostrarlo.

Media Kit público y ejemplos institucionales usan logos originales aportados por el usuario. Tres propuestas: Hero, Cartelera, portada/feed. Materiales de entrega propuestos 1920x720, 1200x675 y 1080x1350; no son promesas de píxeles visibles en todos los dispositivos. El feed vertical tiene ejemplo de material, no se certifica su inserción universal.

Admin: afiliación mediante control existente aVerified/afiliado_verificado, reservado a administración. No equivale a crear cuenta ni a reclamar perfil. Beneficio de difusión mediante selección editorial o campaña bonificada, con fechas y revisión; no se activa pauta automáticamente por marcar afiliación. Los registros PRO se preservan para compatibilidad; sus controles se ocultan en el editor principal. Productos anteriores se preservan sin borrado; el catálogo ofrecido por la política nueva contiene tres espacios por consulta sin importes públicos.

Consultas comerciales: formulario validado y protegido con Turnstile. Solo staging. Tabla D1 commercial_inquiries, idempotencia de envío, control de origen, cinco solicitudes por IP y ventana de 15 minutos. Bandeja Admin Consultas comerciales. No envía correos y lo informa. Requiere desplegar el Worker nuevo; antes de eso el formulario queda deshabilitado por capabilities.

Contrataciones: contacto directo entre productor y artista. Las consultas son visibles para su artista destinatario sin aprobación o derivación administrativa, incluidas las pendientes del circuito descartado. Las condiciones y pagos quedan entre las partes.

Pendientes del cambio integral: recepción real de correos a administración y contratante, responsable/casilla aprobados, circuito de cotización y contrato revisado, seguimiento del cobro de la contratación, derivación interna a Nacional/delegaciones y adaptación integral de ofertas/postulaciones de Bolsa. No se declara cerrado este circuito; no se modificaron registros reales ni producción.

Validación: 52 comprobaciones dirigidas de frontend y 15 de backend aprobadas. Una comprobación antigua home-entry.mjs falló por esperar build 12048, sin relación con este cambio; no se corrigió ni se cuenta como aprobada. Build staging generado. El despliegue del Worker sigue siendo manual.

## Aclaración de pagos
La plataforma no cobra ni paga contrataciones artísticas. Productor y artista acuerdan y realizan sus pagos directamente. La administración sindical solo interviene en publicidad cuando corresponde.

## Seguimiento de consultas
Admin puede pasar cada consulta a Recibida, Contactada, Propuesta enviada o Cerrada y guardar una nota interna. Control de versión impide sobrescribir cambios de otra persona. Ninguna de esas acciones envía dinero ni afirma que se envió un correo.
El PDF actualizado está versionado en assets/comercial/UADAV_Stream_Media_Kit.pdf y enlazado desde el Media Kit web y Admin.


Actualización 2026-11-06: se descarta la intermediación sindical obligatoria en Bolsa y contratación. Esta decisión sustituye las menciones anteriores del media kit PDF sobre coordinación y pago a artistas; su actualización gráfica queda pendiente. Cartelera y publicidad mantienen su modelo.
