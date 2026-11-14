# Presentación y navegación · integración beta

## Alcance

Cambios de frontend en la rama `integration/staging-preserve-beta-20261109`. No se modifica el Worker, producción, KV ni D1, ni se habilita el convenio Lynx. No se fusiona el PR #54.

- Slider con dos flechas visibles; rotación automática, pausa al enfocar/posar el cursor y respeto por movimiento reducido. El estado de posición queda oculto.
- Fondo institucional con una ilustración de espectáculo y movimiento CSS sutil; no es una grabación de un espectáculo real ni un video emitido.
- Catorce géneros en una sola fila horizontal, con fotografía alusiva y orden configurable desde Admin.
- Una fila de artistas: curaduría manual primero, catálogo y descubrimientos, selección inicial sin duplicados. Las referencias de patrocinio de las filas anteriores se conservan como puntos de montaje bajo la misma sección.
- Artistas circulares; radios con portadas cuadradas. No cambia reproducción ni permisos.
- Espacio publicitario disponible construido con texto HTML legible y fondo de marca. Las creatividades contratadas conservan su imagen completa.
- Primera visita a la raíz del preview abre `/promo.html`; se guarda una preferencia de navegación solo al elegir entrar. Las siguientes visitas van a la app. `?full=1` y enlaces directos a la app siguen disponibles. Admin puede desactivar la primera visita desde Portada y secciones.
- La landing no busca contenidos en YouTube ni crea perfiles. La instalación web se ofrece cuando el navegador lo permite, 45 segundos después de la primera entrada desde la landing. No se anuncia una descarga nativa inexistente.

## Recursos visuales

Los dos recursos se generaron con la herramienta integrada de imágenes y se optimizaron a WebP sin alterar su composición. Se encuentran en `assets/visual/show-stage.webp` y `assets/visual/music-genres.webp` (aproximadamente 404 KB entre ambos). No son fotos de artistas identificados ni de un evento concreto.

### Prompt de espectáculo

Use case: ads-marketing. Create one polished photographic website asset, landscape 1792x1024 or similar wide ratio. UADAV STREAM Argentine performing arts platform, midnight navy and cyan blue identity. Cinematic theatre stage with live band musicians, a contemporary dancer and an aerial silk performer, all anonymous adult performers seen at medium distance, no identifiable celebrities, no logos. Strong realistic stage lighting in cyan, deep blue, hints of warm amber, a dark audience foreground. Composition: clear very dark negative space across left 40% for HTML headline, energetic performers and stage concentrated center and right, natural anatomy, sophisticated editorial event photography. No lettering, no UI, no watermarks. This is a generic promotional illustration of performing arts, not a photo of a named event.

### Prompt de géneros

Use case: ads-marketing. Create ONE square photographic texture atlas for music genre cards. A precise seamless 4 by 4 grid of sixteen equal square photographs, no gutters, no borders, no words, no lettering, no logos or UI. Each photo fully occupies its cell, recognizable musical subject centered. Row 1: pop concert microphone with pink blue spotlights; electric rock guitar on concert stage red amber; Argentine folklore acoustic guitar and bombo drum warm sunset; Argentine tango bandoneon and dancing shoes dark gold. Row 2: cumbia percussion congas and colorful tropical stage; cuarteto piano accordion with energetic Córdoba concert lights; electronic DJ decks with blue violet laser lights; urban music studio microphone with neon purple backdrop. Row 3: jazz saxophone on intimate stage; classical violin and bow with orchestral sheet music; Latin percussion and acoustic guitar with warm red lighting; soul funk bass guitar with amber purple lighting. Row 4: reggae guitar with subtle green gold warm light; vintage vinyl record and turntable warm cream tones; acoustic guitar close-up blue teal stage; live drum kit and concert audience cyan lights. Cohesive premium realistic editorial music photography, rich contrasting colors, cinematic material details, no identifiable people, no text. This whole image will be used as one CSS background atlas.
