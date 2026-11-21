# Revisión integrada de staging · 4 de noviembre de 2026

## Base comprobada
Pages ff33a336a19d16c4413264d7ea8e7b2b0290be72; Worker f21eac361a3a7b681aefafd6edf56b96a69de669. Ramas separadas; producción sin modificaciones.

## Recorridos visibles
- Perfil Soda Stereo - Topic, canal UCQJuTjhtb6Oyy2kStA1BUKw: Videos carga 50 elementos y Ver más agrega otros 50. Aviso de catálogo parcial visible. No certifica catálogo completo ni audio.
- Búsqueda Soda Stereo: 25 resultados; guardar En la Ciudad de la Furia cambia a Quitar de Favoritos. Al abrir Biblioteca/Favoritos permanece el contenido.
- Bolsa: tres oportunidades visibles; convocatoria externa diferenciada de postulaciones internas. No se publicaron ofertas ni postulaciones nuevas.
- Cartelera: dos registros visibles antes de corregir; detectado Beethoven–Brahms del 1/11 en Próximos eventos el 4/11.

## Cambios
- Normalización limitada de entidades de texto de YouTube antes de pasar videos al perfil; la presentación sigue escapando HTML.
- Biblioteca muestra y permite buscar el autor o descripción existente de los favoritos en vez de recurrir prematuramente al proveedor.
- Agenda excluye eventos terminados; conserva fechas futuras, funciones posteriores, eventos con fecha_fin vigente y fechas a confirmar. Los registros no se eliminan.

## Pruebas
Pages 766/766 aprobadas tras cambios; Worker 453/453 aprobadas sin modificar su código. No equivalen a pruebas completas reales desde todos los dispositivos.

## Pendientes que impiden declarar cierre integral
- Recuperación pública de ofertas: no habilitar hasta cerrar canje HTTP transaccional con correo real.
- Comprobar en staging el vencimiento automático del destacado mediante cron; actualmente no hay destacados activos para observar.
- Biblioteca de playlists personales todavía reproduce el primer elemento: cola continua pendiente.
- Probar sincronización entre dispositivos con cuenta real y reproducción audible en PC/móvil. La sesión de esta revisión es nueva.
- Revisión autenticada de Admin no realizada en esta pasada. Las consultas técnicas públicas por CLI devolvieron 403 en este entorno y no certifican cambios en capacidades.
