# Experiencia móvil primero — 29/10/2026

Se corrige la grilla de búsqueda para la estructura actual de botón de reproducción y botón Favorito independiente. A anchos <=1024, la imagen y el texto están dentro del botón; Favorito tiene 44x44 px sin superposición.

Los dos controles del mini reproductor se disponen horizontalmente con 44x44 px; se reserva espacio explícito y el título sigue truncándose dentro de su columna. Radio también usa controles de 44 px.

Compartir adopta acciones de una columna a <=380 px, textos sin desbordes y tamaño de diálogo controlado. No cambia la semántica ni el envío de enlaces.

La página qa-responsive-staging incorpora búsqueda, artistas, perfil público, Mi Perfil y biblioteca. Revisa anchos; no simula teclado, hardware, gestos, lectores de pantalla o Smart TV.

706 pruebas Pages aprobadas. Cambios guardados para staging. Validación visual publicada y prueba física móvil pendientes al guardar este documento. No se modificó Worker ni producción.

## Verificación publicada en navegador

El verificador ya ofrece las nuevas pantallas. Búsqueda revisada a anchos de marco 320/390/430: anchos interiores 303/373/413 sin desborde horizontal. Favorito 44x44 y sin superposición con reproducción. Perfil público y Compartir caben en 320; diálogo dentro del viewport, sin desborde interno, acciones de 46px de alto. Compartir revisado también en 390/430, con controles de 46px y sin desborde. Mini reproductor en 320: tarjeta de 302px dentro de viewport 318px; Expandir y Cerrar de 44x44. Se cerró el reproductor al terminar. Mi Perfil y Biblioteca cargados en 320: contenido de 303px dentro de viewport de 303px; no se editaron datos ni enviaron formularios.

Estas medidas son revisión de anchos en iframe, no emulación de hardware. Siguen pendientes teclado y gestos físicos, orientación y reproducción audible en teléfono. La evidencia no certifica automáticamente otras secciones o anchos tablet/TV.
