# Portada y carga editorial — segunda pasada
Fecha: 29/10/2026, Argentina. Solo staging.

## Cambios
El Home no renderizaba la configuración banners del Admin. Se agregaron tres anclas existentes: superior, entre secciones y pie.
Solo imágenes/enlaces HTTPS sin credenciales; no se ejecuta HTML heredado.
Registros regionales quedan excluidos de este renderer general para no ampliar su audiencia. Esto no valida la entrega de campañas segmentadas.
Las imágenes fallidas retiran el bloque; no dejan un enlace vacío.
La placa propia se identifica como PUBLICIDAD · ESPACIO DISPONIBLE.
Pruebas: 714/714 aprobadas. El test de arranque mantiene pendiente la carga de configuración para asegurar que no frena catálogos.

## Verificación pública
Se observó homeBanner-top en el Home de staging.
Imagen assets/editorial/espacio-publicidad.svg cargada, naturalWidth positivo, ancho 1120px en viewport de escritorio.
Destino observado: Media Kit local. No se creó una campaña ni un cobro.
Ballet apareció en Selección editorial. Las miniaturas externas de YouTube no quedan certificadas por esta observación.

## Carga mediante Admin
Se agregaron:
- El Cascanueces — Vamos al Ballet · Tráiler 2022. ZUSn9OI3l_g.
- Vamos a la Música — Playlist de Fundación Konex. PLnkpkdx4rUkYaNqdWDxsH9g2IGxeUGj2M.
Fuente: https://www.fundacionkonex.org/n1493-
El sitio oficial mostraba ese iframe y el enlace de playlist. La ficha del tráiler aclara temporada 2022 y carácter de archivo, sin anunciar funciones vigentes.
Se confirmó Todo 6 y Playlists 1: cinco videos y una playlist visibles.
No se probó reproducción audible ni navegación completa de la nueva playlist.

## Pendientes
El Home aún no renderiza la configuración general secciones del Admin. No se crearon filas ficticias para aparentar funcionamiento.
Simplificar el editor de secciones (actualmente expone JSON) requiere un cambio de UX y validación.
Completar carga de otras disciplinas, perfiles y contenidos, sin simular titulares ni contactos.
Producción intacta; recuperación general y pagos no se habilitaron.
