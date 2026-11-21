# Experiencia propia de reproducción — 2026-10-19

## Alcance
Implementación en rama audit/public-job-status-20261012 y demo staging, sin modificar producción.
Radio: barra persistente con botón de expansión, portada grande, nombre/programa, volumen y reproducción. El modo expandido conserva el elemento audio original; Escape minimiza, Tab permanece en sus controles, el fondo queda inerte y se restaura al cerrar o navegar.
Audio HTML directo: carátula validada HTTP(S), portada alternativa, reproducción/pausa, volumen, progreso y saltos de diez segundos sólo si hay duración finita. No descarga ni aloja medios; continúa usando URLs.
Video: conserva controles oficiales y relación 16:9; ajuste de imagen y dimensiones/tipografía mayores desde 1600px. No implementa una nueva navegación completa de TV ni acredita compatibilidad con mandos físicos.

## Validación
11 pruebas existentes de controles nativos, enlaces oficiales y rutas de sesión aprobadas; sintaxis de JavaScript correcta. Checks contract/static del shell aprobados. Validación visual del despliegue se registra en el resultado de la sesión.
Sin pruebas físicas de iPhone, Android o Smart TV en este entorno. El audio HTML directo requiere aceptación con una fuente autorizada; la radio utiliza la emisora de prueba autorizada existente.

## Siguiente fase
1. Validar carátulas y metadatos por fuente de radio/audio, sin inventar información de canciones.
2. Probar audio nativo en móvil real, bloqueo, auriculares e interrupciones.
3. Diseñar y probar inicio/catálogo para TV con navegación completa por mando.
4. Aceptación de video y fullscreen por proveedor, incluyendo fuentes autorizadas de TV/IPTV.
AirPlay/Cast, Picture-in-Picture y progreso persistente de podcasts no se declaran implementados.
