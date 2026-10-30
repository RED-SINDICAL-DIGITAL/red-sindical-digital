# UADAV STREAM: criterio de primera versión final
Fecha de decisión: 29/10/2026. Entorno de implementación: staging. Producción intacta.

## Producto acordado
Descubrir artistas, disfrutar su contenido y encontrar dónde verlos o contratarlos.
Cinco accesos: Explorar, En vivo, Cartelera, Trabajo y Mi Perfil. Radio dentro de En vivo.
Móvil primero. Fondo oscuro, acentos azules, imágenes protagonistas y acciones breves.
Explorar y reproducir sin registro. Identidad única para funciones persistentes y gestión privada.
No se incorpora Artista PRO ni Stream+. Publicaciones básicas gratuitas; ingresos por destacados Hero/Cartelera y pauta provincial o nacional. No ampliar las tres ubicaciones publicitarias ni introducir anuncios sobre el reproductor.

## Cambios implementados en esta entrega
- Se elimina la regla de foco blanco del input del shell y se conserva foco azul visible en el contenedor.
- Favorito permanece visible; Más tarde, Playlist, Biblioteca y enlace externo se agrupan en un disclosure nativo accesible.
- El enlace externo conserva sus validaciones y queda dentro de Más opciones.
- Se conservan IDs, permisos de módulos, controles oficiales y ancla de avisos de reproducción.
- Títulos del Admin alineados con su navegación: Portada, Identidad, Contrataciones y Resumen.
- Pruebas automatizadas Pages: 710 aprobadas; scripts inline de app/admin con sintaxis válida.
No se declara reproducción audible ni corrección confirmada en el Android del operador por estas pruebas.

## Condiciones para llamar final a la primera versión
1. Búsqueda sin errores visuales; resultados, paginación y estados incompletos claros.
2. Perfiles con identidad rápida y videos/playlists públicos paginados, sin prometer una réplica íntegra de YouTube Music.
3. Reproducción persistente y estados reales: listo no equivale a reproduciendo. Embed primero y salida externa última; auditar las instancias configuradas antes de declarar fallback completo.
4. Seguir, favoritos, playlists y compartir sin pérdidas silenciosas ni enlaces privados.
5. Cartelera y Bolsa: publicación, gestión privada, caducidad, avisos, exportación y restauración verificadas de punta a punta.
6. Recuperación real de acceso validada sin habilitar anticipadamente la recuperación general de ofertas.
7. Admin: tareas cotidianas fáciles y funciones técnicas separadas; gestión de contenidos, portada, identidad, cuentas, eventos, ofertas, radios, campañas, cobros, avisos, moderación posterior, respaldos y auditoría.
8. Validación en móvil real y PC, permisos y privacidad; despliegue productivo posterior y expresamente autorizado.

## Pendientes que no deben ocultarse
- Revisión completa de reproducción/fallback de instancias y pruebas de videos restringidos.
- Reproductor compacto y radio unidos visualmente a navegación; nueva composición aún pendiente.
- Comprobación física Android del foco y del menú.
- Auditoría funcional del Centro de Diseño y de operaciones del Admin: cambiar títulos no la reemplaza.
- Caducidad remota automática de destacados y recuperación general de Bolsa siguen requiriendo cierre documentado.
- Métricas comerciales y segmentación territorial con pruebas reales antes de prometer resultados.
