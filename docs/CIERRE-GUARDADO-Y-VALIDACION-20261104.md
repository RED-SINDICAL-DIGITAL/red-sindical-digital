# Estado de cierre · 4/11/2026

## Correcciones de esta pasada
- Favoritos y Biblioteca comparten identidad de video para evitar copias por ID de catálogo o variante de URL.
- Quitar un favorito elimina todas sus copias equivalentes.
- El guardado de un video excluye instantáneas y posiciones transitorias de reproducción: evita anidar una cola completa en cada favorito, historial o playlist.
- Al cambiar de tema se refrescan Favorito y Más tarde.
- La fila de eventos del Inicio también excluye eventos pasados, conservando funciones futuras y eventos en curso. El catálogo del selector de Admin conserva los registros históricos.

## Validación
Pages: 772/772 pruebas aprobadas después de todos los cambios. Worker: 453/453, sin código nuevo. No se certifica reproducción audible real ni sincronización entre dispositivos.

Admin autenticado y verificado: Administrador, API V11.7 y D1 OK. Bolsa: 18 oportunidades totales y 12 postulaciones; no se leyeron datos privados de candidatos ni se modificaron registros. Cartelera: 2 registros administrables, 0 destaques pendientes y 0 destacados. La agenda pública puede mostrar menos registros porque excluye fechas pasadas.

## Bloqueo restante
La QA privada /qa/recuperacion-oferta exige autenticación independiente en el origen del Worker. Se solicitó formulario seguro; la llamada agotó el tiempo de espera. La comprobación posterior con una pestaña nueva también agotó el tiempo de espera. Estado de esa autenticación desconocido: no se debe afirmar éxito ni rechazo de credenciales.

No se enviaron correos, no se rotaron credenciales, no se habilitó recuperación pública, no se crearon campañas ni se modificaron pagos, cron, variables o D1. Producción intacta.

Para cerrar Bolsa/Cartelera aún deben verificarse la recuperación HTTP con correo real y canje transaccional, y el vencimiento remoto automático de destacados. No hay destacados activos para observar actualmente. La QA aislada histórica no sustituye esas comprobaciones operativas.
