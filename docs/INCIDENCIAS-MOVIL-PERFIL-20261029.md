# Incidencias reales de celular y referencia visual — 29/10/2026

El operador informó cuadro blanco al escribir, perfil lento, videos que no abren y acceso poco claro a más videos. Confirmó giro correcto y reproducción persistente al navegar. Capturas muestran Madonna Hung Up y Michael Jackson Smooth Criminal reproduciendo; Farewell My Summer Love rechazado por el reproductor de YouTube. No se atribuyen las restricciones del proveedor a un error local ni se intentan sortearlas.

## Correcciones Pages staging

El perfil sustituye la dependencia antigua content-player-v928 por el normalizador actual. Caso reproducido: registro con id interno y video_id válido; el normalizador anterior priorizaba el id interno y podía perder el video. Regresiones nuevas verifican identidad, URL y preservación de otro proveedor.

Canales descubiertos con metadatos exactos de menos de cinco minutos se abren desde caché local existente sin repetir la consulta de identidad. No se sustituyen canales por coincidencias de nombre y datos expirados o de otro canal se consultan de nuevo.

Inicio del perfil ofrece acceso explícito a la pestaña de videos y sus controles de paginación, solo cuando existen videos o canal automático. No se afirma que esto corrija todo fallo de proveedor al cargar más.

Móvil: búsqueda con miniatura grande 16:9, título y autor debajo y Favorito separado; perfil con videos en una columna; herramientas del reproductor en dos columnas. Buscadores con colores oscuros explícitos en foco/autofill. El cuadro blanco no aparece en las capturas aportadas: la causa sigue sin confirmar; el estilo es preventivo hasta revisión física.

710 pruebas Pages aprobadas y sintaxis de perfil verificada. Cambios de código guardados, validación publicada pendiente. Referencia BeMusic usada para jerarquía visual; no se incorporaron controles ni funciones ficticias. No se cambió Worker ni producción.

## Verificación posterior publicada

En el verificador de anchos a marco390 (viewport de contenido373), búsqueda mostró miniatura347x195.1875 y botón de reproducción347 de ancho, sin desborde (contenido373). Perfil Masterboy Topic: acceso Ver todos los videos y cargar más abrió pestaña Videos; había50 botones de videos y después de Ver más videos hubo100, manteniendo pestaña abierta y cursor disponible. Perfil sin desborde horizontal en el mismo ancho. Se cerró el reproductor de prueba que presentó restricción de proveedor. No se certifica disponibilidad de ese video ni reproducción audible; la restricción externa sigue separada. El cuadro blanco y los tiempos percibidos requieren nueva prueba física.
