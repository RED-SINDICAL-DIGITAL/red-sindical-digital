# Continuidad de demo · 27/10/2026

Producción no modificada en esta pasada. El usuario quiere una demo pública para inversores, contenido real desde Admin e imágenes; prioriza simplicidad, sin perder funciones.

## Estado observado
- Worker remoto operativo: entrega 11769 previamente comprobada. No asumir que los commits siguientes se desplegaron.
- Cartelera experimental: commit bc3bac57b01933f64f4e269f2ab07d4729dc8713. EVENT_ATOMIC_STAGING no configurada ni activada. 362 pruebas locales aprobadas. Ruta integrada experimental limitada al hostname de staging. No es una entrega lista para desplegar.
- Bloqueos Cartelera: avisos tras fallo de copia KV; concurrencia entre eventos distintos; reintento seguro del formulario; permisos/edición/borrado; D1 real aislado. No prometer atomicidad de KV.
- Mi Perfil: cambios a92b3cc19ff28865644f762bbd42d58717e796f3 observados en navegador de escritorio: artista/biblioteca accesibles y enlace duplicado eliminado.
- Radio: 9ffabe48925adf950db419e734e37488a7a25a01 cambia prioridad CSS de ampliación móvil y versión del recurso. Cloudflare Pages check success. Falta prueba visual móvil. Escritorio: reproductor compacto/ampliado visible y navegación a En vivo observada. Pruebas radio-player-participation:9 aprobadas. radio-interaction-ui y radio-playback fallaron en revisión: investigar, no afirmar suite completa aprobada.
- Bolsa: convocatoria Teatro Colón JOB-EXT-8AC153AF reactivada desde Admin staging. Tarjeta pública observada y botón abrió la URL oficial /concurso/concurso-publico-y-abierto-orquesta-estable-del-teatro-colon-4/. Queda visible por pedido de contenido real. Se ocultaron tres filas ficticias: DEMO QA 19-10 y las dos QA11757 Publicación automática. No borradas. Permanecen visibles dos ofertas de procedencia por revisar.
- Restauración aislada Bolsa/cuenta: reporte operador 11769 completo14/14, rollback probado, sin restauración operativa ni integral de plataforma. No pedir repetir.

## Imagen y acceso
Se generó una propuesta visual ilustrativa de portada, aún no implementada. No presentar como captura del producto. Memoria externa devuelve Personal context is unavailable for this conversation; no inventar ejemplos anteriores. Solicitar únicamente enlace, captura o fragmento del ejemplo visual si es necesario. Nunca claves en chat.
GitHub accesible. Admin staging autenticado observado. Cloudflare panel no verificado en esta pasada; despliegues de Pages consultados desde checks de GitHub.

## Método
Conservar ramas Pages y Worker independientes. Antes de editar, reconciliar los cambios locales con los commits remotos: los checkouts contienen cambios ya guardados en GitHub y referencias locales retrasadas. No resetear ni descartar archivos sin cotejarlos. Registros de pruebas y datos ficticios no equivalen a validación móvil o producción.
