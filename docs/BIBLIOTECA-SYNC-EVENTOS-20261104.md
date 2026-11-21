# Guardado de Biblioteca dentro de la app · 4/11/2026

## Problema corregido
Las páginas embebidas reutilizan UADAVAccount del contenedor principal y retornaban antes de registrar escuchas locales. Biblioteca emite uadav:library-change, mientras el sincronizador solo atendía uadav:local-change. El evento storage de otra sección actualizaba el encabezado pero no programaba un guardado. El sondeo periódico podía guardar más tarde, pero el aviso inmediato no era fiable.

## Cambio
Las secciones embebidas reenvían los dos avisos de cambio al contenedor persistente, sin enviar datos ni crear otro cliente. El contenedor escucha ambos y también cambios de storage en las claves conocidas de la biblioteca. Un único debounce agrupa avisos repetidos. No sube datos si el dispositivo no está vinculado. No se modificó el protocolo de conflictos, autenticación, permisos ni almacenamiento del Worker.

## Validación
777/777 pruebas Pages aprobadas. Nuevas pruebas verifican subida GET/PUT de un favorito tras library-change, agrupación de storage y local-change sin duplicar guardados, rechazo de claves ajenas, reutilización del cliente del contenedor y ausencia de subida sin vincular.

Pendiente comprobar dos dispositivos reales con la misma cuenta; estas pruebas no certifican ese recorrido ni reproducción audible. Producción intacta. La recuperación pública no se activó.
