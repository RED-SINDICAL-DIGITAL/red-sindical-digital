# Objetivo aprobado — UADAV STREAM

Aprobado por Ruso el 13/11/2026. Esta guía es memoria versionada del proyecto; no prueba de que todas las pantallas ya estén implementadas.

## Referencias visuales

1. Cartelera, Trabajo y Radio: `libfile_798e32629ec881919cee95265da57718`.
2. Acceso y navegación: `libfile_4a4bf80b560c819195840e7e02238941` — Explorar, En vivo, Mi Perfil, landing.
3. Artistas y Biblioteca: `libfile_8768fe7745d48191b4716fa1e59f20ac` — Soy artista, directorio, perfil público, Biblioteca.
4. Publicación y gestión: `libfile_a321cbd179fc81919e918b7d1964396c` — Publicar evento, Publicar oferta, Radio Studio, Administración.
5. Buscar y descubrir: `libfile_c4a57cdfff688191ada82e4321cedbc8` — búsqueda, podcasts, películas/series, ficha del evento.

## Diseño y navegación

Menos es más. Azul marino, superficies pizarra, acentos celestes, texto blanco, SVG intuitivos con nombres accesibles. Móvil primero; adaptar a PC, tablet y TV. Una navegación y un buscador global. Sin cabeceras gigantes ni accesos repetidos. Los contenidos ilustrativos no son datos reales ni nuevas funciones automáticamente aprobadas.

## Video y Radio

Conservar el player de video aprobado: lateral en PC, reproducción persistente al navegar, minimizar/ampliar/pantalla completa, cola, playlists, compartir y guardados. No reiniciar el contenido al cambiar de sección.

Radio usa el mismo lenguaje. Pantalla completa con carátula grande y metadatos en el área principal, comunidad al costado; no un espacio negro vacío. Chat/Pedidos compactos. Controles distinguibles: reproducir/pausar, detener, compartir, minimizar, pantalla completa y cerrar. Pausar conserva la fuente, detener corta la señal, cerrar detiene y retira el player. **Deslizar minimiza; X cierra**: sustituye el gesto anterior que cerraba. Preservar moderación y pedidos reales.

## Pantallas objetivo

- Explorar: editorial compacto, seguir viendo/escuchando, mundos y artistas; sin buscador duplicado.
- En vivo: transmisiones y radios; marcar en vivo solo con señal confirmada.
- Mi Perfil: Mi artista, Mis eventos, Mis trabajos, Biblioteca, Radio Studio y Cuenta; publicar evento/oferta disponibles.
- Landing: presentar valor y dos caminos claros, explorar o Soy artista.
- Soy artista: alta, gestión y recuperación sencillas. Reclamos desde el contexto privado correspondiente.
- Directorio: retratos circulares, especialidades y búsqueda; preservar filtros y posición al volver.
- Perfil artístico: portada moderada, reproducir, seguir, contratación directa, compartir; pestañas solo con contenido.
- Biblioteca: favoritos, playlists, artistas, radios e historial; conservar identidades de medios.
- Cartelera: distribución inspirada en Turbo Entrada con identidad UADAV; hero moderado, destacados y grilla uniforme, filtros juntos. **Publicar evento aquí y también en Mi Perfil**.
- Trabajo: filas compactas, filtros juntos, condiciones completas desplegables; contacto directo y sin comisiones.
- Publicar evento/oferta: formularios simples con vista previa y opciones secundarias discretas; publicación gratuita inmediata y gestión posterior.
- Radio Studio: gestión privada autorizada, chat, pedidos y modos Automático/Manual/Pausado.
- Admin: contenido, reportes, publicidad y Diseño; preservar permisos y respaldo existente.
- Buscar: resultados por tipo sin otro buscador global.
- Podcasts: portadas y episodios compactos, duración y reproducción.
- Películas/series: catálogo externo y filtros; no inventar derechos, descargas o suscripciones.
- Ficha de evento: fecha, lugar, entrada, compartir y acceso externo cuando corresponda; sin ticketera propia.

## Footer, legal e institucional — nuevo alcance autorizado

Footer discreto al final del contenido de cada sección; no fijo encima del player ni dentro del chat/modales. Ayuda, Contacto, Términos, Privacidad, Derechos/CCT, Media Kit, Convenios y publicidad. En móvil debe adaptar enlaces sin desbordar.

Contador secundario: el endpoint actual tiene una base precargada de 15.651 y permite edición manual. No es prueba de audiencia verificada. Mostrar cifra solo tras validación y habilitación desde Admin; distinguir visitas de personas únicas. No incrementar mediante QA.

Separar convenios colectivos de acuerdos institucionales y beneficios. Publicar acuerdos solo con documentos confirmados, alcance, vigencia, requisitos y contacto. No tomar conversaciones o maquetas como prueba de un convenio vigente.

Correo oficial confirmado por Ruso: **uadavstream@gmail.com**. Los demás datos legales e institucionales se completan desde Admin. Conservar Términos/Privacidad y edición desde Admin. Antes del cierre jurídico completar con datos confirmados el responsable legal, domicilio, contacto operativo, finalidades y circuito de derechos; requiere revisión jurídica. Fuente orientativa oficial: https://www.argentina.gob.ar/aaip/datospersonales/derechos .

Media Kit mantiene el modelo comercial existente, sin inventar métricas, precios públicos, planes PRO, exposición garantizada o ventas.

## Negocio y seguridad

Perfiles y publicaciones comunes gratuitos; contratación directa sin intermediación ni comisiones. Sin PRO, Stream+ ni ticketera propia. Publicidad/destacados según configuración y acuerdo administrativo vigente. Preservar fuentes externas y privacidad; datos de una sesión no deben quedar visibles en otra.

## Ejecución y estado

A. Guía permanente, footer y accesos institucionales.
B. Cartelera/Trabajo/publicación y controles/pantalla completa de Radio, preservando video.
C. Explorar, En vivo, Mi Perfil y landing.
D. Artistas, Biblioteca y catálogos.
E. Admin/Radio Studio, QA por tamaño y aceptación en staging antes de producción.

Existe un preview funcional y una pasada de 1.093 pruebas aprobadas. Las cuatro láminas posteriores siguen siendo objetivo pendiente de implementación integral; no declarar las 16 pantallas terminadas por haber generado sus imágenes.

## Entrega de implementación: correo y controles
- Correo oficial predeterminado: uadavstream@gmail.com; editable desde Admin. Los datos legales y documentos se incorporan desde allí.
- Publicar evento restituido en Cartelera, conservando Mi Perfil. Grilla de tres columnas en PC, tarjetas apaisadas y filtros abiertos inicialmente en PC.
- Radio: carátula grande y comunidad en pantalla completa, pausa/stop/compartir/cierre visibles, stop conserva la emisora y permite reanudar; deslizar minimiza manteniendo audio. Video conserva su comportamiento aprobado.
- Validar esta entrega en CI y en el preview antes de declarar terminado el resto del plan.

## Publicación — siguiente entrega
- Evento y oferta incorporan vista previa local mientras se completa el formulario, con imagen HTTPS opcional en la vista previa y sin enviar datos.
- Se conservan campos, validaciones, publicación, accesos y comprobantes existentes. Las opciones plegadas se abren ante campos inválidos.
- Verificación visual sin publicaciones reales en móvil y PC integrada en CI.

## Explorar y En vivo — entrega compacta
- Continuar viendo y escuchando abre el contenido de Explorar cuando existe historial, manteniendo el orden personalizado de Admin.
- En vivo: cabecera reducida, navegación a transmisiones/radios dentro de la sección, tarjetas de emisora compactas.
- Un video de artista sin confirmación actual queda en canales disponibles; solo emisiones confirmadas o detectadas en los últimos tres minutos aparecen en Transmitiendo ahora.
- Preservar todos los canales disponibles, errores/reintento y reproducción persistente. QA sintético en móvil, PC y TV.

## Mi Perfil — accesos compactos
- Cabecera personal reducida y controles conservados; Radio Studio usa el icono SVG existente.
- Publicar evento y Publicar oferta visibles, reutilizando los enlaces originales sin duplicarlos.
- Cuenta y Radio Studio como accesos secundarios claros; exploración y ayuda dentro de Más opciones.
- Se mantienen montajes, subpantallas y aislamiento de datos por cuenta. QA de accesos y subpantallas en 320 px, móvil, PC y TV.
