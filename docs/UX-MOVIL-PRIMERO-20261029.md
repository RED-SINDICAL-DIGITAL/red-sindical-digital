# Experiencia móvil primero — 29/10/2026

Se corrige la grilla de búsqueda para la estructura actual de botón de reproducción y botón Favorito independiente. A anchos <=1024, la imagen y el texto están dentro del botón; Favorito tiene 44x44 px sin superposición.

Los dos controles del mini reproductor se disponen horizontalmente con 44x44 px; se reserva espacio explícito y el título sigue truncándose dentro de su columna. Radio también usa controles de 44 px.

Compartir adopta acciones de una columna a <=380 px, textos sin desbordes y tamaño de diálogo controlado. No cambia la semántica ni el envío de enlaces.

La página qa-responsive-staging incorpora búsqueda, artistas, perfil público, Mi Perfil y biblioteca. Revisa anchos; no simula teclado, hardware, gestos, lectores de pantalla o Smart TV.

706 pruebas Pages aprobadas. Cambios guardados para staging. Validación visual publicada y prueba física móvil pendientes al guardar este documento. No se modificó Worker ni producción.
