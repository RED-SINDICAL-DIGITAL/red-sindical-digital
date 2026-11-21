# UADAV STREAM — Plan de integración aislada (Radio y TV/IPTV)

## Estado y alcance
Esta rama NO debe desplegarse sobre el Worker de producción. Las pruebas de contrato verifican patrones de código, no las transiciones reales ni las condiciones de carrera. Mantener el formulario público cerrado.

## Preparación de Cloudflare (requiere acceso autorizado a la cuenta)
1. Crear Worker de staging independiente, por ejemplo `uadav-api-staging`, con ruta exclusiva `*.workers.dev` o subdominio de pruebas. **No agregar rutas ni dominios de producción.**
2. Crear D1 independiente `uadav-staging-db` y KV independiente `uadav-staging-kv`. Vincular con los mismos nombres de bindings que espera `worker.js` (inspeccionar el archivo de configuración antes de desplegar). Nunca reutilizar IDs de producción.
3. Configurar secretos de staging distintos de los de producción; desactivar integraciones externas con efectos reales (correos, pagos, notificaciones, importaciones, webhooks). No copiar credenciales, usuarios ni datos personales reales.
4. Usar un frontend de pruebas que apunte **solo** al Worker staging. Bloquear indexación y mostrar un indicador visible de entorno de pruebas.
5. Verificar `/api/signal-onboarding/config`: master, radio y tv cerrados por defecto; acceso no autorizado a endpoints administrativos debe devolver 401.
6. Registrar URLs, identificadores de recursos y resultados de prueba, **sin secretos**. No modificar producción.

## Casos de integración obligatorios
| Caso | Resultado esperado |
| --- | --- |
| Formulario cerrado (radio / tv) | No acepta solicitudes |
| Habilitar solo radio | Acepta radio; rechaza TV |
| Habilitar solo TV | Acepta TV; rechaza radio |
| Derechos no confirmados | Rechaza solicitud |
| Stream inválido o duplicado | Rechaza solicitud |
| Envío válido | Queda pending, sin publicación |
| Intentar publicar pending | HTTP 409 |
| Aprobar sin publicar | Sigue ausente del catálogo |
| Rechazar | No se publica |
| Publicar radio aprobada | Un registro en KV y sincronización D1 |
| Publicar TV aprobada | Un registro en catálogo TV |
| Publicar dos veces | No duplica |
| Dos administradores publican misma solicitud | Solo uno obtiene claim |
| Dos solicitudes del mismo tipo simultáneas | No se pierden registros |
| Cambiar revisión durante publishing | HTTP 409 |
| Interrupción tras escritura KV | Recuperación + conciliación sin duplicar |
| Recuperación antes de 5 minutos | HTTP 409 |
| Recuperación con bloqueo activo | HTTP 409 |
| Usuario no administrador | HTTP 401 para configuración, revisión, publicación y recuperación |
| Radio Studio / TV Studio | No pueden acceder al Admin central |
| Prueba móvil, tablet, PC y Smart TV | Formulario y catálogo utilizables, reproducción comprobada |

## Riesgos pendientes antes de habilitar producción
- La ruta de revisión requiere una actualización atómica condicional en D1: una comprobación de estado previa no basta contra una carrera simultánea.
- Las solicitudes antiguas que solo existen en KV pueden revisarse, pero la publicación usa claim D1; necesitan migración controlada.
- El lease del catálogo dura 120 segundos; una operación que exceda ese tiempo podría perder exclusividad. Preferir persistencia por registro en D1 o un mecanismo transaccional/serializado antes de habilitar altas públicas.
- La ruta de publicación debe recuperar de forma segura errores antes de adquirir el bloqueo, además de los errores posteriores.
- Confirmar qué endpoints públicos de radio/TV leen D1 y KV, y comprobar que la publicación aparece en los reproductores.
- Ejecutar pruebas reales en staging y documentar evidencias. GitHub Actions de contratos no sustituye integración.

## Criterio de salida
No habilitar inscripciones ni desplegar Worker de producción hasta resolver los riesgos, ejecutar todos los casos en staging y aprobar la revisión de permisos y reproducción.
