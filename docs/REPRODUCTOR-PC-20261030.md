# Reproductor PC · revisión 30/10/2026

## Alcance
Pages staging exclusivamente. Sin cambios de Worker, producción, cuentas ni datos.

## Cambios
Se retiran los enlaces de salida propios de UADAV a YouTube en errores de video, playlists y temas no disponibles. Reintento interno para errores transitorios; aviso y otro contenido para restricciones de inserción. Se conservan los controles y la marca del reproductor oficial, que puede mostrar sus propios enlaces.

Media Session integra videos y playlists oficiales: reproducción/pausa/parada/búsqueda y posición. Los eventos reales del reproductor determinan el estado; ni onReady ni una orden de play implican éxito. Cambiar de contenido libera controles anteriores, los errores los limpian y los mensajes de posición verifican origen y ventana. Navegación y modo mini conservan el iframe; no se fuerzan reanudaciones al ocultar una pestaña.

## Validación
738/738 pruebas CJS aprobadas; incluye regresiones de radio/audio nativos, controles del sistema para video, limpieza de eventos y ausencia de salidas propias a YouTube. La prueba en navegador cloud carga el reproductor oficial de Masterboy, pero no se observó avance tras Play: no se certifica reproducción audible ni continuidad de fondo en Windows. La causa específica del reporte de segundo plano permanece sin confirmar. Pendiente prueba real PC con otra pestaña y ventana minimizada; no atribuir el fallo a ahorro de energía sin evidencia. No equivale a auditoría completa de toda la plataforma.
