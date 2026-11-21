# Reproducción y teclado — 29/10/2026

En navegador staging, abrir un resultado de Masterboy creó el reproductor integrado. Cambiar a Cartelera conservó el mismo video y controles en el shell. El tiempo observado siguió en 0:00 pese al clic en Play: no se certifica reproducción audible ni se atribuye una causa sin evidencia.

Se corrigió una interferencia del teclado: el shell aplicaba Escape y flechas de video antes de comprobar si el foco estaba en un campo de texto. Ahora respeta INPUT, TEXTAREA, SELECT, contenteditable, composición de texto, teclas con modificadores y eventos ya tratados. Fuera de esos casos mantiene los atajos de video y navegación horizontal.

688 pruebas Pages aprobadas. Cuatro regresiones nuevas cubren edición, modificadores/composición, atajos normales y navegación entre secciones.

Cambio limitado a rama Pages staging, sin Worker ni producción. Validación del cambio desplegado y reproducción real pendientes.
