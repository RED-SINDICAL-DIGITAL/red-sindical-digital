# Publicidad y secciones manuales — 30/10/2026
Entorno: staging. Producción intacta.

## Configuración pública
Desde Admin autenticado se completaron Entre secciones y Pie con la misma placa que Superior.
Los tres slots se observaron en la web con imagen cargada, rótulo PUBLICIDAD · ESPACIO DISPONIBLE y destino Media Kit.
No se crearon anunciantes, campañas, cobros ni testimonios falsos.

## Editor y portada
Nuevo selector de biblioteca: buscar, marcar, quitar y ordenar sin escribir JSON.
Campos cotidianos visibles: título, descripción, diseño y visibilidad.
IDs, modo, tipo, límites, consultas y referencias anteriores quedan en opciones avanzadas.
Las referencias anteriores se conservan al agregar y ordenar. Quitar elimina duplicados de la misma selección.
Se creó y persistió SEC-MVUKJ092-BZI6, Escena y movimiento, modo manual, contenido universal, 3 items:
1. El Cascanueces — Vamos al Ballet · Tráiler 2022.
2. Cirque du Soleil — Spotlight on Alegría.
3. Vamos a la Música — Playlist de Fundación Konex.
Se probó reordenar y se confirmó orden tras recargar Admin.
La fila pública resuelve contra catálogo público actual: no publica copias de items borrados, ocultos, privados ni URLs con credenciales.
Las filas manuales de contenido soportan videos, playlists y audio. Auto/híbrido y filas de artistas, eventos o radios siguen pendientes de integración; no se declaran resueltos.
La fila quedó alineada con el resto del Home (33.390625 px de margen observado en escritorio). Su orden respecto del banner no depende de cuál consulta termine primero.

## Pruebas
Suite Pages: 720/720 aprobadas. Scripts inline de Admin y Home con sintaxis válida.
Tras ajustes de presentación, suite enfocada de secciones: 6/6.
Verificación de anchos: 390px -> viewport interior 373, scrollWidth 373; 320px -> viewport interior 303, scrollWidth 303. Tres banners cargados y una fila manual. No equivale a prueba en teléfono físico.
La playlist abrió el embed oficial dentro del shell, listó 30 temas y ofreció Cargar más temas. Se conservan estados de temas privados/no disponibles. No se certificó reproducción audible ni se canjeó ningún acceso.
Miniaturas externas de YouTube siguen sin ser verificables en este navegador; requieren contraste en dispositivo real.

## Próximo trabajo
Integrar modos y tipos de filas restantes sin mostrar controles que aparenten funcionamiento.
Revisar Admin móvil con el selector y otras operaciones.
Continuar carga editorial y tratamiento de imágenes, manteniendo tres ubicaciones publicitarias.
