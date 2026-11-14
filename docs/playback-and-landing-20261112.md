# Reproducción integrada y landing editable

Alcance: rama integration/staging-preserve-beta-20261109 y preview. Sin cambios en producción, Worker, KV ni D1. Los guardados de aceptación se simulan en memoria; no se guardan campañas ni configuraciones reales.

- Inicio: el orden de los bloques ya no depende del buscador retirado del pie. Se conservan los espacios de publicidad al reordenar. Géneros y filas de Admin también pueden ordenarse.
- Landing: editor completo de cabecera, bloques, textos, enlaces, imágenes, marca, colores y pie. Bloques visibles/ocultos y orden con flechas. Guarda en `landing_config.landing_page` usando el transporte existente, conservando las tres claves anteriores. Sin HTML libre. Validación de URL, colores y bloques.
- PC: panel derecho de reproducción con contenido central que se adapta, cola y barra inferior. Móvil: controles compactos y vista ampliada. TV: objetivos y tipografía ampliados.
- Continuidad: la selección de Inicio, búsqueda o perfil artístico entrega su propia cola. YouTube y archivos nativos soportan finalización y siguiente. No se interpreta el mero ingreso al iframe como reproducción exitosa. Se exige estado real de reproducción antes de avanzar. Los mensajes deben proceder del iframe actual y del origen del proveedor.
- Las playlists existentes conservan su controlador; ahora respetan la preferencia de continuación automática. No hay bucle al terminar una selección. La navegación conserva el mismo elemento de reproducción.
- Drive y OK.ru: enlaces compatibles se abren en el reproductor persistente; no se inventa seguimiento de finalización para proveedores sin integración.
- Radio: portada/nombre abren la emisora; play reproduce. Se retira el botón repetido Abrir emisora y el puente antiguo que ejecutaba un segundo sondeo de metadatos. Identidad de emisora y carátula actual se muestran separadas. Las portadas tardías no sustituyen un tema nuevo y los metadatos de otra emisora no cambian el reproductor actual.
- Hero: una propuesta por destino habilitado de Descubrí tu mundo, además de contenido editorial y publicidad intercalada. Hay contenido rotativo desde el inicio mientras llega la configuración. No se marca contenido grabado como transmisión en vivo.
- Limpieza: se retira el controlador v135 de playlists sin referencias; se mantiene v136. Se reemplazan el editor parcial de landing, el botón repetido de radio y la dependencia del buscador antiguo para el orden.

Aceptación: pruebas unitarias de cola, validación, migración y orden con espacios publicitarios; navegador aislado con eventos de YouTube sintéticos y final real de archivos WAV, persistencia del elemento al navegar, guardado/recuperación de landing simulados y revisión de tamaños móvil/PC/TV. Las restricciones de reproducción automática o de inserción de cada proveedor se conservan y se muestran al usuario.

## Simplificación de secciones — integración, 12/11

La radio usa una sola ficha con pestañas Ahora, Historial, Pedir canción, Chat e Información. Abrirla desde la barra conserva el audio del shell; cambiar de pestaña no envía mensajes ni pedidos y mantiene las comprobaciones de moderación existentes. El directorio tiene una cabecera compacta. Trabajo presenta las oportunidades antes de publicación y gestión; Cartelera agrupa sus filtros avanzados en un desplegable. Los controles de publicación, postulación, consentimiento y acceso privado conservan sus funciones.

El menú del reproductor es una lista vertical; agregar un enlace a la cola es una opción desplegable. Los videos de YouTube compartidos abren `reproducir.html` dentro de la plataforma y requieren pulsar Reproducir. Otras fuentes conservan su enlace de origen. Compartir mediante el sistema se ofrece solamente si el navegador lo admite. Cambios de frontend en integración; sin despliegue de Worker ni cambios de datos.
