# Cierre de demo — 18/10/2026, Argentina

Objetivo: demo funcional acotada de la plataforma existente. No equivale al cierre de todos los módulos ni autoriza producción. Pagos bancarios reales al final; STREAM+ eliminado, Ticket deshabilitado, Bolsa/contratación abiertas y gratuitas.

## Estado con evidencia

| Sector | Estado | Evidencia y límite |
| --- | --- | --- |
| Inicio y navegación | Parcialmente operativo | Hoy Chrome staging cargó portada, contenidos, tres radios y contador; Trabajo y Cartelera abren dentro del shell. No certifica reproducción ni dispositivos físicos. |
| Perfiles y cuenta | Parcialmente operativo | Creación FREE/edición/inbox probadas en navegador en checkpoints anteriores; permisos y recuperación con Worker/SQLite y clientes aislados. Revalidación con propietario autenticado sigue pendiente; vinculación de dispositivo bloqueada por revisión automática del formulario seguro. No se eludió el bloqueo. |
| Press Kit/PRO | Parcialmente operativo | Herramientas y permisos FREE/PRO probados anteriormente; publicación de presentación, compartir y reingreso con propietario requieren cierre actual. |
| Admin | Parcialmente operativo | Reclamos, consultas, pendientes y moderación directa comprobados en Chrome; 80 pruebas recientes satisfactorias. La última referencia review-safe de moderación ya se confirmó por HTTP servido. IA sin clave en staging; no está operativa. Sesiones de navegador remoto pueden perderse al reiniciar el entorno; no es prueba de pérdida de sesiones del usuario. |
| Búsqueda/video/playlists | Parcialmente operativo | Búsqueda y paginación con evidencia previa; avance real del video en dispositivos objetivo y recuperación de playlists deben repetirse. |
| Radio/TV | Parcialmente operativo | Radio tuvo reproducción/persistencia verificadas anteriormente. Faltan repetición en candidato de demo, TV y paneles de operador completos. |
| Cartelera | Parcialmente operativo | Hoy muestra hero genérico, filtros y 0 eventos en staging. Crear-publicar-ficha-reingreso aún pendiente. No poblar datos ni publicar registros privados automáticamente. |
| Bolsa de Trabajo | Parcialmente operativo | Página abierta/gratuita y 0 oportunidades en navegador. Hoy se agregan nueve pruebas de formulario/transporte y cuatro contratos satisfactorios, más Worker+SQLite/KV con dos postulaciones y consulta privada. Son oportunidades sembradas en aislamiento, no publicación pública desde navegador. |
| Pagos | Deshabilitados para demo | Pruebas de simulación no equivalen a cobros reales. No habilitar ni realizar transferencias durante esta etapa. |
| Móvil/tablet/Smart TV | Sin cierre | Responsive y pruebas previas parciales; faltan recorridos completos sobre dispositivos físicos. |

## Cinco recorridos de aceptación de la demo

1. Cuenta/artista: acceder a una cuenta de prueba existente autorizada, abrir el artista exacto, editar y recargar, ver consultas y comprobar persistencia. Revisar reclamo sin conceder propiedad automáticamente.
2. Presentación: preparar un Press Kit con PRO simulado autorizado, revisar/publicar el envío, abrir enlace público y comprobar compartir/imprimir. Conservar borrador y acceso ante fallos.
3. Entretenimiento: búsqueda → reproducir → siguiente → navegar → volver; playlist con tema no disponible; radio persistente. Medir avance real y anotar restricciones de la fuente.
4. Cartelera: crear un evento ficticio identificado, comprobar revisión/publicación según configuración, ficha, filtros y enlaces. Destacados y pagos simulados por separado.
5. Trabajo: publicación ficticia → listado → postulación → comprobante privado → seguimiento → llegada a Admin. Comprobar autorización de consulta, errores, duplicados y privacidad.

Repetir los recorridos relevantes en PC y móvil antes de ofrecer la demo como completa; tablet/TV deben figurar como compatibles sólo tras prueba correspondiente. La demo puede acotarse por módulos que ya cumplan, con limitaciones visibles y sin anunciar funciones no verificadas.

## Incremento de Bolsa de Trabajo

Se bloquean dobles envíos y cambio/cierre de oportunidad mientras se procesa; tras éxito se conserva el comprobante y se bloquea el reenvío de esa apertura. Abrir otra oportunidad limpia el comprobante previo, no los datos del postulante. Se exige success:true, identificador y clave válida para comunicar éxito. Fallos conservan campos y permiten reintento explícito. Las escrituras no se repiten contra otra API; GET mantiene fallback configurado. JSON inválido no se convierte en un éxito vacío.

Integración aislada con Worker exacto f42c7f1aff03da4cec3ed98789c7b08054959e9c, SQLite y KV: dos solicitudes con claves diferentes; consulta privada de estado sin datos personales; clave ajena denegada; lista administrativa anónima denegada; Admin no recibe hash; KV conserva hash, no clave; trabajo inexistente no crea solicitud. CF-Connecting-IP usa dirección de documentación sólo como fixture local. No hubo tráfico externo, mensajes ni registros remotos.

## Límites que continúan

No existe certificación global de producción. Falta cerrar los cinco recorridos, pruebas de dispositivos, concurrencia relevante D1/KV y recuperación; TV/operadores, Web Push e IA requieren sus verificaciones/configuraciones. Cobros reales y conciliación bancaria se hacen después de aceptar la demo. No se puede dar un porcentaje fiable ni una fecha sin resolver estos recorridos; sumar tests no sustituye la aceptación completa.
