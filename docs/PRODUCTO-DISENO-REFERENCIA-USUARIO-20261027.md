<!-- Referencia de producto aportada por el usuario. No certifica implementación ni despliegue. -->

# ★ UADAV STREAM
## DOCUMENTO MAESTRO DE DISEÑO, IMAGEN, NAVEGABILIDAD Y WEB APP
**Versión de referencia:** V11.7 y decisiones hasta el 27 de octubre de 2026  
**Identidad:** LA PLATAFORMA DE LOS ARTISTAS DE VARIEDADES  
**Alcance:** Identidad visual, experiencia de usuario, navegación, reproducción, dispositivos, personalización y administración.

---

# 1. CONCEPTO GENERAL DE LA PLATAFORMA

UADAV STREAM es una plataforma digital audiovisual, cultural, artística y laboral destinada a los artistas de variedades, sus públicos, productores, organizadores y contratantes.

Su diseño debe combinar las mejores experiencias de plataformas como Netflix, Teatrix, Spotify y YouTube Music, sin copiar directamente ninguna de ellas.

La distribución conceptual aprobada fue:

- **70 % Netflix / SoloLatino:** protagonismo de contenidos audiovisuales, portadas cinematográficas, colecciones, descubrimiento y navegación inmersiva.
- **20 % Teatrix:** identidad cultural, artística, espectáculos y presentación profesional de los artistas.
- **10 % Spotify / YouTube Music:** experiencia musical, reproductores, bibliotecas, favoritos y reproducción persistente.

La aplicación debe funcionar como un producto propio, con identidad reconocible y un modelo de utilización simple.

### Principio fundamental

**Menos es más.**

Una persona sin conocimientos tecnológicos debe poder utilizarla sin capacitación previa.

El objetivo es que una persona mayor, un niño, un artista o un productor puedan encontrar y utilizar las funciones principales sin instrucciones.

La complejidad técnica debe quedar oculta detrás de una interfaz clara.

No se deben incorporar funciones visibles únicamente porque tecnológicamente sean posibles.

Cada botón debe cumplir una función real.

---

# 2. IDENTIDAD VISUAL

## 2.1 Nombre y marca

Nombre principal:

**★ UADAV STREAM**

Lema:

**LA PLATAFORMA DE LOS ARTISTAS DE VARIEDADES**

La estrella constituye un elemento identificador de marca y puede utilizarse como isotipo, favicon e icono de aplicación.

La identidad debe ser moderna, audiovisual y profesional.

No debe parecer una página sindical convencional ni un portal de noticias.

Debe transmitir el aspecto de una auténtica plataforma de entretenimiento y servicios culturales.

La identidad institucional de UADAV debe mantenerse, pero sin sobrecargar visualmente la experiencia.

La marca debe poder editarse desde el panel de administración.

## 2.2 Colores

La dirección visual aprobada establece:

- Negro profundo como fondo principal.
- Grafito y gris oscuro para superficies secundarias.
- Blanco para textos principales.
- Gris claro para textos complementarios.
- Cian o azul luminoso como acento principal.
- Violeta como acento secundario de uso limitado.

Se priorizan contrastes claros y buena legibilidad.

Los colores deben poder modificarse desde el Administrador sin editar código.

No debe haber exceso de degradados, luces, efectos neón ni elementos decorativos.

El aspecto oscuro premium y algunos recursos de transparencia o glassmorphism formaron parte de la dirección original. Su utilización debe ser moderada, priorizando claridad, rendimiento y coherencia visual.

## 2.3 Tipografía

Se estableció una dirección tipográfica moderna, inspirada en Inter o SF Pro.

Características:

- Textos fáciles de leer.
- Títulos visualmente jerarquizados.
- Pocos tamaños tipográficos diferentes.
- Buen espaciado.
- Contraste suficiente.
- Botones claramente identificables.
- Evitar textos largos sobre imágenes.

Las tipografías deben responder correctamente a los distintos tamaños de pantalla.

## 2.4 Iconografía

La iconografía debe utilizar un mismo lenguaje visual.

Cada acción debe ser reconocible sin necesidad de explicaciones extensas.

Los iconos principales representan:

- Explorar.
- Buscar.
- Reproducir.
- En vivo.
- Cartelera.
- Trabajo.
- Mi Perfil.

Debe evitarse mezclar iconos de diferentes estilos.

El Administrador debe permitir personalizar los principales iconos de marca y navegación.

## 2.5 Tarjetas y contenidos

Se decidió utilizar tarjetas visuales para representar contenidos, artistas, emisoras, eventos y espectáculos.

Características:

- Imágenes como elemento protagonista.
- Bordes suaves.
- Dimensiones coherentes por tipo de contenido.
- Títulos breves.
- Información secundaria limitada.
- Acciones fácilmente accesibles.
- Imágenes adaptadas para evitar recortes incorrectos.

Las tarjetas deben reaccionar correctamente al toque, clic y selección mediante control remoto.

Las imágenes de portada, banners y miniaturas deben conservar proporciones apropiadas para cada dispositivo.

---

# 3. PORTADA PRINCIPAL Y EXPERIENCIA DE EXPLORACIÓN

## 3.1 Pantalla inicial

La decisión más reciente establece que la plataforma debe abrir directamente en **Explorar**, sin páginas intermedias innecesarias.

La portada debe ofrecer desde el primer momento contenido audiovisual y opciones de navegación.

No debe mostrarse una pantalla de bienvenida que obligue al usuario a realizar pasos adicionales.

## 3.2 Hero cinematográfico

La parte superior de Explorar debe contar con un Hero audiovisual.

Este elemento puede mostrar:

- Artistas destacados.
- Espectáculos.
- Producciones audiovisuales.
- Eventos.
- Campañas institucionales.
- Contenidos promocionados.

El Hero debe poder administrarse desde el panel.

Debe ser posible modificar imágenes, títulos, descripciones, enlaces, botones y elementos visuales sin tocar código.

La composición debe responder a PC, tablet, celular y Smart TV.

En dispositivos móviles, la imagen y el texto deben reorganizarse para evitar títulos cortados o rostros fuera del encuadre.

No debe cubrir toda la experiencia ni dificultar el acceso inmediato a otras secciones.

## 3.3 Organización de la portada

Se acordó construir una experiencia de exploración mediante colecciones y filas de contenido.

Entre las colecciones previstas están:

- Continuar viendo o escuchando.
- Recomendados para vos.
- Artistas que tenés que conocer.
- Música y espectáculos.
- Contenido en vivo.
- Radio y audio.
- Cine, series y documentales.
- Cartelera y próximos eventos.
- Contenidos destacados.

Estas colecciones pueden variar según la disponibilidad real de contenido.

No deben mostrarse secciones vacías que aparenten errores.

### Descubrimiento automático

Se decidió que la sección de artistas no debe depender únicamente de altas manuales.

Debe poder descubrir artistas y contenidos mediante las fuentes externas integradas.

El descubrimiento debe contemplar tanto búsquedas realizadas por usuarios como mecanismos automáticos.

---

# 4. NAVEGACIÓN PRINCIPAL

## 4.1 Menú definitivo

La decisión de navegación más reciente establece cinco destinos principales:

1. **Explorar**
2. **En vivo**
3. **Cartelera**
4. **Trabajo**
5. **Mi Perfil**

Este orden debe mantenerse en la navegación principal móvil.

La Radio pasa a estar integrada dentro de En vivo y deja de necesitar un destino independiente dentro de la barra inferior.

La búsqueda sigue siendo una función de acceso inmediato, aunque no forme parte de los cinco destinos principales.

## 4.2 Barra de navegación móvil

En celulares se decidió utilizar una barra inferior fija.

Debe permanecer accesible durante la navegación normal de la aplicación.

Características:

- Cinco opciones principales.
- Icono y nombre claramente identificables.
- Estado activo visible.
- Tamaños adecuados para tocar con los dedos.
- Ausencia de desplazamiento horizontal del menú.
- Integración con el mini-reproductor.

El reproductor compacto debe ubicarse por encima del menú inferior cuando esté activo.

No deben superponerse sus controles.

## 4.3 Navegación en computadora

En pantallas grandes la plataforma puede utilizar navegación lateral o superior, conservando la misma arquitectura funcional.

Las decisiones originales contemplaron una barra lateral colapsable.

La versión de escritorio debe aprovechar el espacio mediante:

- Grillas de contenidos.
- Carruseles.
- Paneles amplios.
- Mayor cantidad de tarjetas visibles.
- Reproductor persistente.
- Acceso rápido a la búsqueda.

No se deben crear versiones funcionalmente diferentes de la aplicación para PC y móvil.

## 4.4 Navegación en tablet

La tablet debe reutilizar los componentes responsive.

La interfaz puede distribuir más contenido por fila y adaptar la navegación según el espacio disponible.

No debe depender de interacciones exclusivas de mouse.

## 4.5 Botón Atrás

Se decidió que la navegación interna debe respetar el comportamiento habitual del dispositivo.

Cuando el usuario utiliza Atrás, debe regresar a la pantalla anterior sin abandonar inesperadamente la aplicación.

Esto incluye:

- Cerrar ventanas emergentes.
- Salir de un reproductor ampliado.
- Volver desde el perfil de un artista.
- Regresar desde el detalle de un evento.
- Conservar el contexto de navegación cuando sea posible.

La implementación debe utilizar un historial de navegación coherente.

---

# 5. REPRODUCTOR GLOBAL

Una de las decisiones más importantes fue evitar múltiples reproductores independientes y conflictivos.

Debe existir una experiencia de reproducción unificada.

## 5.1 Comportamiento

El reproductor debe permitir:

- Iniciar reproducción.
- Pausar.
- Reanudar.
- Minimizar.
- Expandir.
- Cerrar.
- Consultar información del contenido.
- Controlar volumen cuando el dispositivo lo permita.

La experiencia debe ser consistente entre radio, audio y video, respetando las particularidades técnicas de cada fuente.

## 5.2 Persistencia

La reproducción debe mantenerse durante la navegación entre secciones siempre que el origen y el navegador lo permitan.

Se confirmó en pruebas la reproducción en segundo plano y la recuperación del contenido luego de recargar la página.

La recuperación tras recarga puede requerir que el usuario pulse Reproducir nuevamente por las restricciones de los navegadores.

No debe prometerse reproducción automática cuando el dispositivo la bloquea.

## 5.3 Mini-reproductor

En móviles se utiliza un reproductor compacto sobre la navegación inferior.

Debe mostrar la información indispensable y controles principales.

Al tocarlo debe abrir la experiencia de reproducción ampliada.

En computadora puede mostrarse una barra inferior persistente.

El reproductor nunca debe bloquear botones importantes de la aplicación.

## 5.4 Video

Se acordó priorizar:

- Reproducción dentro de UADAV STREAM.
- Controles fáciles de utilizar.
- Modo pantalla completa.
- Posibilidad de minimizar cuando sea compatible.
- Continuidad al navegar.
- Aprovechamiento del tamaño de pantalla.

Se solicitó eliminar los accesos visuales innecesarios del tipo «Ver en YouTube», cuando las condiciones técnicas y las reglas del proveedor permitan mantener la experiencia integrada.

No se deben eliminar atribuciones o controles exigidos por las plataformas de origen.

---

# 6. BUSCADOR UNIVERSAL

La búsqueda debe ser uno de los elementos centrales de la web app.

Se decidió utilizar un buscador general que permita localizar contenidos y servicios sin conocer previamente su ubicación dentro de la plataforma.

Debe contemplar:

- Artistas.
- Bandas y grupos.
- Música.
- Videos.
- Canales.
- Espectáculos.
- Cartelera.
- Radios.
- Contenidos audiovisuales.

La búsqueda debe utilizar las fuentes habilitadas, incluyendo YouTube API e Invidious, sin eliminar Invidious de los mecanismos de resolución y descubrimiento.

## 6.1 Experiencia de búsqueda

El usuario escribe un término y obtiene resultados utilizables.

No debe quedar atrapado en una pantalla de carga indefinida.

Debe existir:

- Indicador de carga.
- Resultados progresivos.
- Paginación o carga adicional.
- Mensaje cuando no se encuentran resultados.
- Recuperación ante errores.
- Acceso directo a los contenidos.

La búsqueda de un artista debe conducir preferentemente a su perfil público dentro de UADAV STREAM.

## 6.2 Resultados

Los resultados deben utilizar tarjetas con imágenes, nombres y categorías reconocibles.

Se detectó anteriormente el problema de entregar pocos resultados o no recuperar canales completos.

Por eso se solicitó mejorar la paginación y la carga progresiva.

---

# 7. PERFILES DE ARTISTAS

La experiencia de artista debe ser una de las áreas más cuidadas visualmente.

Cada perfil debe funcionar como un verdadero espacio profesional dentro de UADAV STREAM.

## 7.1 Diseño

Elementos previstos:

- Imagen de portada.
- Fotografía o avatar.
- Nombre artístico.
- Descripción.
- Biografía.
- Contenido musical.
- Videos y presentaciones.
- Enlaces relevantes.
- Información profesional.
- Opciones de contacto o contratación, cuando correspondan.

Debe conservar una presentación coherente con el diseño audiovisual general.

## 7.2 Contenido externo integrado

Los perfiles pueden recuperar contenidos desde fuentes externas.

Se decidió no alojar directamente grandes archivos audiovisuales.

La plataforma debe presentar los contenidos dentro de su propia experiencia de navegación, respetando las condiciones de integración de los proveedores.

## 7.3 Organización del contenido

Se solicitó:

- Carga de videos y canales completos mediante paginación.
- Presentación de videos en grilla en PC.
- Navegación simplificada en móvil.
- Evitar que un álbum se muestre incorrectamente como una playlist.
- Biografías traducidas al idioma local cuando corresponda.

Los sliders reservados para la experiencia de Smart TV no deben trasladarse indiscriminadamente a la versión de computadora.

## 7.4 Reclamo y gestión de perfiles

Se decidió que el proceso de reclamar o administrar un perfil no debe estar expuesto como una función invasiva de la vista pública.

Debe gestionarse desde **Mi Perfil**.

El artista debe poder administrar su espacio mediante los mecanismos privados y seguros definidos por la plataforma.

La afiliación sindical no es obligatoria para acceder a las funciones públicas gratuitas.

---

# 8. EN VIVO Y RADIO

## 8.1 En vivo

La sección En vivo agrupa transmisiones compatibles, incluyendo contenidos de televisión, streaming y radio.

Los contenidos pueden provenir de plataformas externas como YouTube, Twitch u otras fuentes admitidas.

La plataforma no necesita alojar las transmisiones.

## 8.2 Radio

Se decidió preservar y evolucionar el diseño funcional existente de Radio.

Su experiencia contempla:

- Identidad de emisora.
- Imagen principal.
- Reproductor.
- Información de lo que está sonando.
- Historial musical.
- Información de programas.
- Comunidad.
- Peticiones musicales.
- Interacción con operadores.

La Radio debe funcionar integrada al entorno general de la aplicación.

No debe abrir accidentalmente interfaces antiguas ni generar capas duplicadas.

## 8.3 Radio Studio

Radio Studio es un entorno específico para operadores.

Debe ser sencillo de utilizar y diferenciar claramente los estados:

**Manual:** las participaciones requieren aprobación.

**Automático:** las participaciones permitidas se publican automáticamente.

**Pausado:** se detienen las nuevas publicaciones según las reglas del modo.

Se confirmó el funcionamiento de estos tres modos en staging.

El operador debe comprender el estado activo sin leer documentación técnica.

---

# 9. CARTELERA

La Cartelera debe tener una experiencia visual comparable a los portales modernos de espectáculos y venta de entradas, pero con identidad propia.

## 9.1 Presentación

Debe contemplar:

- Eventos destacados.
- Tarjetas con imagen.
- Nombre del espectáculo.
- Fecha.
- Lugar.
- Localidad.
- Descripción breve.
- Acceso al detalle.
- Calendario.
- Filtros y búsqueda.

Se planteó un carrusel de destacados y un contenido genérico de respaldo cuando no haya eventos promocionados.

## 9.2 Publicación

Se decidió que la publicación de eventos gratuitos u ordinarios debe ser abierta al público y automática, con controles básicos y moderación posterior.

No debe requerirse aprobación administrativa previa para cada publicación ordinaria.

La publicación destacada constituye un procedimiento diferente, porque puede involucrar un servicio pago.

## 9.3 Diseño del formulario

El formulario debe ser sencillo, comprensible y apto para cualquier usuario.

La información debe organizarse lógicamente.

Debe permitir cargar imágenes, ubicación, descripción, fechas y enlaces de entradas cuando corresponda.

No deben mostrarse campos técnicos.

## 9.4 Administración

El administrador debe poder:

- Editar.
- Corregir.
- Retirar publicaciones.
- Gestionar destacados.
- Revisar comprobantes.
- Administrar banners.
- Configurar fechas de vencimiento.
- Exportar información.

El módulo UADAV Ticket permanece deshabilitado en esta etapa.

---

# 10. BOLSA DE TRABAJO

La Bolsa de Trabajo debe ser pública, gratuita y sin comisiones.

Su diseño debe priorizar utilidad, confianza y rapidez.

## 10.1 Presentación

A diferencia de una sección audiovisual, las ofertas laborales no necesitan grandes imágenes decorativas.

Se priorizan tarjetas limpias con:

- Nombre de la propuesta.
- Actividad o categoría.
- Localidad.
- Fecha.
- Condiciones relevantes.
- Información esencial.
- Botón de postulación.

La lectura debe ser rápida tanto en celular como en computadora.

## 10.2 Publicación automática

Se decidió eliminar la moderación previa general.

Las ofertas y postulaciones deben registrarse inmediatamente, sujetas a filtros básicos automáticos.

El Administrador interviene después para corregir o retirar publicaciones indebidas.

## 10.3 Postulación rápida

Desde Mi Perfil debe existir una opción de postulación rápida.

Los datos personales y profesionales solamente deben enviarse con consentimiento expreso.

## 10.4 Consulta

La persona que publica o se postula debe poder consultar el estado mediante un acceso privado.

Se solicitó agregar mecanismos de recuperación por correo electrónico.

El diseño debe evitar trámites complejos y registros obligatorios innecesarios.

---

# 11. MI PERFIL

Se decidió reemplazar denominaciones antiguas como «Tu UADAVSTREAM» por **Mi Perfil**.

Mi Perfil se convierte en el centro de control personal.

Debe organizar las funciones del usuario sin sobrecargar la pantalla.

Entre sus responsabilidades previstas están:

- Datos personales.
- Gestión del perfil artístico.
- Reclamo de perfil.
- Publicaciones.
- Postulaciones.
- Consultas.
- Notificaciones.
- Servicios contratados.
- Comprobantes.
- Beneficios habilitados.
- Configuraciones personales.

El diseño debe separar claramente las funciones de usuario, artista y administración.

No deben mostrarse herramientas administrativas a usuarios comunes.

Las funciones avanzadas deben aparecer únicamente cuando correspondan.

---

# 12. PWA Y WEB APP

UADAV STREAM fue concebida como una **Progressive Web App (PWA)**.

Debe ofrecer una experiencia cercana a una aplicación instalada, pero manteniendo su funcionamiento web.

## 12.1 Requisitos

- Diseño responsive.
- Manifest.
- Iconos de instalación.
- Service Worker.
- Navegación mediante enlaces internos.
- Conservación adecuada del estado.
- Carga rápida.
- Reproductor integrado.
- Compatibilidad con dispositivos móviles y navegadores modernos.

La instalación debe ofrecerse de forma sencilla cuando el navegador sea compatible.

## 12.2 Comportamiento

La web app debe sentirse como un producto único, evitando recargas completas innecesarias y transiciones confusas.

Las secciones deben compartir un mismo entorno visual y de navegación.

No deben abrirse páginas independientes con cabeceras y menús incompatibles.

## 12.3 Rendimiento

Se definieron criterios de optimización:

- Carga diferida de imágenes.
- Carga progresiva de contenidos.
- Evitar reproductores pesados hasta necesitarlos.
- Carga inicial limitada de tarjetas.
- Paginación.
- Minimizar consultas innecesarias.
- Evitar desplazamientos horizontales accidentales.
- Evitar múltiples barras de desplazamiento.

En las decisiones originales se plantearon lotes iniciales aproximados de seis tarjetas y ampliaciones de seis a ocho contenidos, ajustables según rendimiento y dispositivo.

La aplicación debe priorizar que el usuario vea y pueda utilizar contenido rápidamente.

## 12.4 Distribución futura

Se contempló distribuir la plataforma en Android y eventualmente iOS mediante mecanismos compatibles.

La PWA funciona como base.

No debe afirmarse que existen aplicaciones nativas publicadas hasta que se desarrollen, prueben y distribuyan efectivamente.

---

# 13. SMART TV

Se decidió que Smart TV debe contar con una interfaz adaptada específicamente al televisor.

No basta con ampliar la versión de escritorio.

## 13.1 Navegación

Debe contemplar:

- Control remoto.
- Navegación direccional.
- Enfoque visible.
- Tarjetas seleccionables.
- Botón Atrás.
- Pantalla completa.
- Textos legibles desde lejos.
- Menor necesidad de escritura.
- Uso de carruseles cuando sean adecuados.

## 13.2 Reproducción

El contenido audiovisual debe ocupar un lugar protagonista.

Se contempla el uso de un reproductor de pantalla completa y controles adaptados al mando.

Se propuso vinculación con dispositivos móviles para simplificar búsquedas y operaciones complejas.

Estas capacidades requieren implementación y pruebas específicas en dispositivos compatibles.

---

# 14. ADMINISTRADOR Y CENTRO DE DISEÑO

Una de las decisiones fundamentales fue que UADAV STREAM no debe depender de un programador para realizar modificaciones visuales habituales.

## 14.1 Centro de Diseño

Desde Admin debe poder configurarse:

- Identidad de marca.
- Logotipo.
- Isotipo.
- Favicon.
- Iconos.
- Colores.
- Estilos.
- Hero.
- Banners.
- Elementos promocionales.
- Textos principales.
- Imágenes.
- Organización visual admitida.
- Parámetros de navegación configurables.

Los cambios deben reflejarse en la plataforma sin tener que editar manualmente archivos HTML o JavaScript para cada ajuste cotidiano.

## 14.2 Vista previa

Se decidió contemplar visualizaciones para:

- Celular.
- Computadora.
- Tablet.
- Smart TV.

Las modificaciones deben poder revisarse antes de publicarse.

## 14.3 Organización administrativa

El panel debe contar con navegación lateral clara y funciones agrupadas.

Debe distinguir:

- Diseño.
- Contenidos.
- Artistas.
- Cartelera.
- Trabajo.
- Radio.
- Publicidad.
- Usuarios.
- Configuración.
- Seguridad.
- Respaldos.

Las funciones deben utilizar nombres entendibles.

No deben exponerse términos técnicos como KV, D1 o JSON en operaciones cotidianas que pueda realizar cualquier administrador.

## 14.4 Estado técnico de referencia

En staging se registró la reorganización del Administrador y la aplicación de cambios visuales y del Hero.

Eso no equivale a confirmar que todas las opciones del Centro de Diseño estén completamente terminadas.

Las herramientas administrativas nuevas deben comprobarse mediante pruebas reales antes de considerarlas completas.

---

# 15. PUBLICIDAD Y PROMOCIONES

La publicidad debe integrarse con moderación al diseño.

Se acordó un máximo de tres ubicaciones publicitarias principales, incluyendo espacios como portada, Hero y feed vertical.

La publicidad debe permitir segmentación geográfica por provincia o país.

Un anunciante que contrata una campaña para Santa Fe no debe mostrarse automáticamente a usuarios de Córdoba si la campaña fue restringida a Santa Fe.

Las ubicaciones comerciales deben respetar la experiencia del usuario y no invadir la navegación.

Los banners y campañas deben administrarse desde el panel.

Las promociones pagas de Cartelera deben utilizar un circuito de comprobante, revisión o habilitación según las reglas comerciales configuradas.

---

# 16. FEED VERTICAL

Se contempló un feed audiovisual vertical para contenidos breves.

Debe ofrecer una experiencia táctil natural, especialmente en celular.

Características previstas:

- Video protagonista.
- Navegación vertical.
- Controles simples.
- Información breve del contenido.
- Acceso al artista.
- Compartir.
- Integración publicitaria limitada.

La experiencia no debe competir con el menú principal ni generar reproductores simultáneos.

---

# 17. BIBLIOTECA PERSONAL

Se contempló una biblioteca de reproducción inspirada funcionalmente en aplicaciones musicales y reproductores multimedia.

Funciones previstas:

- Favoritos.
- Historial.
- Playlists.
- Cola de reproducción.
- Continuar escuchando.
- Contenidos guardados.
- Organización personal.

La referencia funcional incluye la simplicidad de Spotify y reproductores tipo VLC.

La biblioteca no debe utilizarse para alojar o distribuir contenido externo sin autorización.

Estas capacidades forman parte de la hoja de ruta; su estado individual de implementación debe verificarse.

---

# 18. COMPARTIR Y ENLACES

Se decidió mejorar la forma en que se comparten contenidos de UADAV STREAM.

Cada contenido importante debe contar con una dirección que permita abrirlo directamente.

Se contempló:

- Enlaces a artistas.
- Enlaces a eventos.
- Enlaces a contenidos audiovisuales.
- Imágenes de vista previa.
- Descripciones.
- Metadatos Open Graph.
- Compatibilidad con WhatsApp y redes sociales.

Los enlaces compartidos deben mostrar una presentación profesional de la plataforma.

---

# 19. ACCESIBILIDAD Y SIMPLICIDAD

Toda la plataforma debe seguir reglas generales de facilidad de uso.

1. No más pasos de los necesarios.
2. Textos claros y comprensibles.
3. Botones suficientemente grandes.
4. Buen contraste visual.
5. Indicación visible de estados.
6. Mensajes de error explicativos.
7. Formularios cortos.
8. Compatibilidad táctil y con teclado.
9. Navegación coherente.
10. Ausencia de funciones que aparenten estar disponibles sin funcionar.

Los estados vacíos y los errores deben explicar qué ocurre y cómo continuar.

No deben mostrarse pantallas infinitas de carga.

La simplicidad prevalece sobre la cantidad de funciones visibles.

---

# 20. ARQUITECTURA WEB

La plataforma utiliza una arquitectura predominantemente serverless.

Tecnologías de referencia:

- Frontend web.
- HTML, CSS y JavaScript.
- PWA.
- GitHub para control de versiones.
- Cloudflare Pages.
- Cloudflare Workers.
- Cloudflare KV.
- Cloudflare D1.
- APIs y fuentes audiovisuales externas.

Se debe evitar el hosting tradicional innecesario y minimizar costos operativos.

## 20.1 Arquitectura visual

La aplicación debe funcionar mediante una estructura de navegación compartida, conocida como App Shell.

Los componentes principales deben reutilizarse.

Esto evita que cada sección implemente su propio menú, cabecera, reproductor y reglas visuales.

## 20.2 Configuración

Los parámetros visuales y contenidos editables deben almacenarse de forma controlada.

Las modificaciones del Administrador deben propagarse correctamente al frontend.

La configuración de producción y la configuración de staging deben mantenerse separadas.

## 20.3 Protección de producción

Todas las modificaciones importantes deben probarse primero en staging.

No se debe modificar producción sin autorización.

Los despliegues deben contar con mecanismos de respaldo, comparación y recuperación.

---

# 21. DECISIONES QUE REEMPLAZARON IDEAS ANTERIORES

Para evitar contradicciones en futuros desarrollos:

**Primero:** el menú principal vigente utiliza Explorar, En vivo, Cartelera, Trabajo y Mi Perfil. Los menús anteriores de siete u ocho opciones no son la referencia definitiva.

**Segundo:** Radio está integrada en En vivo, sin perder su experiencia funcional propia.

**Tercero:** la portada principal es Explorar, no una bienvenida institucional independiente.

**Cuarto:** la plataforma prioriza contenidos audiovisuales y artistas; no debe transformarse en un portal convencional de noticias.

**Quinto:** el público general puede navegar y utilizar las funciones gratuitas sin afiliación sindical obligatoria.

**Sexto:** las publicaciones ordinarias de Cartelera y Bolsa de Trabajo son automáticas, sujetas a filtros y moderación posterior.

**Séptimo:** la plataforma no debe copiar visualmente Netflix, Spotify ni YouTube Music; debe adoptar patrones útiles y mantener una identidad propia.

**Octavo:** Smart TV requiere una interfaz particular, mientras PC, tablet y celular reutilizan la arquitectura responsive.

**Noveno:** la personalización visual debe realizarse principalmente desde Admin.

**Décimo:** se prioriza el lanzamiento funcional de UADAV STREAM antes de desarrollar productos derivados o distribuciones adicionales.

---

# 22. ESTADO CONOCIDO AL 27 DE OCTUBRE DE 2026

## Decisiones consolidadas

- Identidad oscura, moderna y audiovisual.
- Marca ★ UADAV STREAM.
- Navegación principal de cinco secciones.
- Experiencia mobile-first.
- Portada Explorar con Hero.
- Player persistente y minimizable.
- Buscador global.
- Perfiles de artista.
- Radio dentro de En vivo.
- Cartelera pública.
- Bolsa de Trabajo pública.
- Mi Perfil como centro personal.
- Administración visual centralizada.
- PWA.
- Interfaz específica de Smart TV.
- Publicidad segmentada.
- Arquitectura Cloudflare/GitHub.
- Preservación de producción durante las pruebas.

## Funcionalidades con pruebas o avances registrados

- Reproducción y navegación táctil básica en celular.
- Persistencia y recuperación del reproductor.
- Búsqueda y paginación de contenidos.
- Correcciones de búsqueda de artistas.
- Cambios de identidad visual y Hero desde staging.
- Radio Studio con modos Manual, Automático y Pausado.
- Gestión y publicación de Bolsa de Trabajo sobre D1.
- Respaldos y comparaciones de datos.
- Personalización básica del Administrador.

Estas pruebas no equivalen a una auditoría integral de todos los dispositivos.

## Funcionalidades pendientes de cierre o comprobación

- Adaptación visual definitiva de todas las secciones.
- Verificación completa de navegación PC/tablet/móvil.
- Experiencia específica de Smart TV.
- Mejoras de grillas y presentación de videos.
- Carga de álbumes y canales completos.
- Traducción y presentación de biografías.
- Vista previa profesional al compartir.
- Recuperación de accesos privados por correo.
- Correcciones de publicación y conectividad de Cartelera.
- Integración completa de Biblioteca y Favoritos.
- Revisión integral de componentes duplicados o antiguos.
- Validación definitiva del Centro de Diseño.
- Pruebas de instalación y compatibilidad PWA.
- Auditoría previa a cualquier despliegue en producción.

---

# 23. CRITERIO FINAL DE PRODUCTO

UADAV STREAM debe ser una plataforma que cualquier persona quiera utilizar, no solamente una herramienta que el sindicato necesite.

El diseño debe resultar atractivo para espectadores, artistas, productores, anunciantes y organizadores de espectáculos.

La navegación debe ser rápida y natural.

El artista debe sentir que dispone de un espacio profesional.

El usuario debe encontrar contenido interesante sin conocimientos previos.

El productor debe publicar una oferta o buscar talento sin atravesar procedimientos complejos.

El administrador debe controlar la plataforma sin ser programador.

La publicidad debe generar ingresos sin perjudicar la experiencia.

La arquitectura debe permitir crecimiento sin multiplicar costos innecesarios.

**Regla general para todo el desarrollo:**

Conservar lo que funciona, corregir lo que falla, eliminar lo que sobra, simplificar lo complicado y modernizar lo que haya quedado obsoleto.

El objetivo no es tener la mayor cantidad posible de funciones, sino una plataforma audiovisual, cultural y laboral realmente útil, estable, atractiva y preparada para crecer.

**★ UADAV STREAM — LA PLATAFORMA DE LOS ARTISTAS DE VARIEDADES.**
