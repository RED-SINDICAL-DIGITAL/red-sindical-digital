# Selección musical inicial · beta de integración

Esta selección editorial de cuatro artistas conocidos no es un ranking de popularidad, una afiliación, un perfil administrado por el artista ni una insignia de verificación UADAV. Vive en archivos de frontend; no inserta registros en KV/D1.

| Artista | Canal de entrada | Procedencia revisada |
|---|---|---|
| Shakira | UCYLNGLIzMhRTi6ZOLjAPSmw | https://www.youtube.com/channel/UCYLNGLIzMhRTi6ZOLjAPSmw y https://linktr.ee/shakira |
| Soda Stereo | @sodastereo | https://sodastereo.com/ y publicación del canal oficial https://www.youtube.com/watch?v=LB6_e2uA7rE |
| Abel Pintos | @abelpintosVEVO | Sony Music: https://www.sonymusic.es/actualidad/el-artista-argentino-abel-pintos-rompe-el-hechizo-junto-a-beatriz-luengo/ vincula youtube.com/user/abelpintosVEVO |
| La K’onga | UCN1uKoxszK8mgaMvT4dBAcw | https://linktr.ee/Lakongaoficial vincula youtube.com/c/LaKonga; canal https://www.youtube.com/channel/UCN1uKoxszK8mgaMvT4dBAcw |

Se revisaron las fuentes públicas el 11 de noviembre de 2026. Un enlace de canal no garantiza reproducción o disponibilidad de su catálogo en todas las regiones. Las colecciones se consultan al abrir Playlists/Álbumes mediante el endpoint existente `youtube/channel_library`, sin descargar todas las bibliotecas al visitar Inicio. No se inventan álbumes ni IDs de playlists. La clasificación de álbumes se basa en el título o en una coincidencia exacta con un nombre editorial conocido (Las Mujeres Ya No Lloran, Nada Personal); no crea una playlist si el canal no la devuelve. La UI indica que son colecciones identificadas por título.

Admin puede ocultar la selección inicial desde Portada y secciones → Música. Un perfil guardado o excluido del mismo canal/nombre tiene prioridad; no se agrega una segunda tarjeta. Las filas manuales, automáticas e híbridas existentes continúan disponibles para la curaduría de Admin.

La política Invidious primero y YouTube API al final sigue en el Worker existente, que no se modifica ni despliega en esta pasada. Las pruebas de navegador usan API simulada y bloquean tráfico externo: no escriben en los servicios reales ni consumen cuota de YouTube.
