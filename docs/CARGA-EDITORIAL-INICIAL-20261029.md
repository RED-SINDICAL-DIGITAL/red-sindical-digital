# Carga editorial inicial y placas — staging
Fecha: 29/10/2026 (Argentina). Producción sin modificaciones.
Carga efectuada mediante el Admin autenticado, sin manipular credenciales por herramientas visibles.

## Contenido manual
La biblioteca manual mostraba cero registros al iniciar. Se guardaron cuatro registros visibles:
- Masterboy — Feel The Heat Of The Night · Video oficial. YouTube IBnshjEceKA.
- AC/DC — Thunderstruck · En vivo en River Plate. YouTube n_GFN3a0yj0.
- Cirque du Soleil — Spotlight on Alegría. YouTube UIdwWJEfBH4.
- Soda Stereo — De música ligera · El Último Concierto. YouTube OX-us7PEfkc.
Cada registro tiene título, URL, proveedor youtube, tipo video, categoría, miniatura del proveedor y descripción editorial.
Fuentes contrastadas en búsqueda web: publicaciones de los canales y referencia oficial AC/DC.
Verificado en tabla Admin: Todo 4, los cuatro visibles. No se certificó reproducción audible ni disponibilidad de todos los embeds.
No se crearon perfiles de propietario, cuentas delegadas, eventos próximos, empleos reales ni playlists en esta entrega.
La carga de todas las secciones sigue pendiente; este lote es inicial.

## Placas
Tres SVG editables en assets/editorial: espacio-publicidad.svg, espacio-convocatoria.svg, espacio-testimonios.svg.
Galería: /ejemplos-editoriales-staging
Las tres imágenes cargaron correctamente en navegador (complete y naturalWidth positivo), con revisión visual.
Publicidad: espacio disponible, sin anunciante. Convocatoria: ejemplo no activo, sin postulación. Testimonios: espacio reservado, sin opiniones inventadas.
Se configuró únicamente imagen/enlace del espacio Superior existente desde Admin:
https://uadav-stream-staging.pages.dev/assets/editorial/espacio-publicidad.svg
Destino: Media Kit local.
Se recargó Admin y se confirmó persistencia de imagen y enlace. Cero campañas/productos registrados; no se simularon cobros.
No se alteraron los otros dos espacios.

## Corrección de publicación
El build permite assets/vendor, no img. Los recursos se movieron a assets/editorial y se corrigieron galería y Admin.
El primer intento no se consideró válido hasta comprobar la carga de las tres imágenes.
