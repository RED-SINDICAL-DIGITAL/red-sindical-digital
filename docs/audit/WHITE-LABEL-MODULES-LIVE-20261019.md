# Controles de marca blanca y En vivo — 2026-10-19

El Worker aún no fue desplegado por el usuario. Se acumulan RSS y módulos en el mismo worker.js, sólo para futura aceptación en staging.

## Implementado
Registro compartido de módulos, etiquetas de Admin y rutas con/sin .html. Admin Sistema > Módulos incorpora Inicio, Explorar/búsqueda, Mi perfil, Biblioteca, Playlists, Cine/series, Shorts, Artistas, Radio, Pedidos musicales, Chat de radio, Radio Studio, Podcasts, TV, Cartelera, Trabajo, Contratación, Entradas, PRO, publicidad y sindicato.
La configuración conserva datos al desactivar. Admin nunca se desactiva por el registro público.
El runtime aplica enlaces y botones del shell; las vistas embebidas aplican accesos internos y controles de participación. La navegación directa en el shell muestra Sección desactivada. La barra móvil reduce sus columnas según accesos habilitados.
El Worker pendiente amplía controles en APIs públicas principales, respeta acceso central de gestión en las nuevas reglas y detiene el cron RSS si Podcasts está apagado. Los controles UI no sustituyen la autorización del backend.
En vivo reúne radios y TV, permite radio sin IPTV, omite consultas a fuentes apagadas y distingue errores de listas vacías. Un ID de video por sí solo ya no afirma EN VIVO.

## Validación
11 pruebas locales de rutas, participación y En vivo; integración aislada de flags/404, conservación al reactivar, Admin y cron. Regresiones Radio Studio y mensajes/pedidos, RSS y sintaxis de Admin/app/live aprobadas.
Sin cambios en configuración ni fuentes reales de staging. Prueba visual pública y checks de despliegue se informan en la sesión. No se verificó el panel privado autenticado ni dispositivos físicos.

## Pendiente
Desplegar Worker consolidado en staging para aceptación de APIs/RSS. Comprobar guardado de módulos con sesión Admin y navegación real tras recargar. Las rutas principales comparten la política, pero sigue la revisión de plantillas públicas antiguas y endpoints de catálogo compartido; no se declara aislamiento de contenido sensible mediante flags.
