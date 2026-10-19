# Continuidad de demo — 19/10/2026

Base: `audit/public-job-status-20261012`. Rama aislada: `audit/continuidad-demo-20261019`.
**Alcance:** aceptación y correcciones de demo, sin merge, migraciones, despliegues ni habilitación de pagos en producción.

## Evidencia recuperada (no extrapolar)
- PC Chrome staging: trabajo sintético JOB-MVF8XT4Q publicado tras moderación, postulación y consulta privada de comprobante verificadas.
- PC Chrome staging: evento gratuito ficticio EV-MVF91D41, aprobación, ficha y filtros verificados.
- Radio de prueba: progreso real de audio, pausa, reanudación y cierre del reproductor verificados, incluido cambio de sección.
- Búsqueda Masterboy 24→46 resultados y regreso desde perfil verificado; **video integrado estancado en 0** en navegador cloud.
- Pruebas automáticas y aisladas no sustituyen autorización real de operador, navegadores físicos ni Workers/D1/KV en condiciones de carga.

## Criterios de cierre de la demo (bloqueantes)
| Prioridad | Circuito | Prueba de aceptación | Regla de seguridad |
| --- | --- | --- | --- |
| P0 | Video | Reproducir video autorizado y observar avance del tiempo > 0; siguiente; volver; reintento por error | Nunca ocultar fallo de fuente ni prometer reproducción no autorizada |
| P0 | Cuenta/artista | Propietario autorizado: editar → guardar → recargar → consultar inbox; un tercero no puede editar | No convertir reclamos en propiedad pública/automática |
| P0 | Radio Studio | Operador habilitado para estación exacta: ingresar, operar y revocar; usuario ajeno rechazado | Admin central no equivale a operador |
| P0 | TV/IPTV | Abrir señal autorizada reproducible, navegar, abandonar y volver; indicar incompatibilidad del dispositivo | No activar señales de prueba NO REPRODUCIR |
| P0 | Móvil | En dispositivo real: cinco flujos principales, controles táctiles, teclado y orientación | No usar sólo emulación responsive como evidencia |
| P1 | Tablet y Smart TV | Recorrido por control táctil / remoto, foco visible y fallback de reproducción | Reportar limitaciones por navegador |
| P1 | Press Kit | Guardar borrador, publicar, compartir, imprimir/PDF y reingresar | Acceso y escritura sólo del artista exacto |
| P1 | Resiliencia | Simular desconexión y reintento en KV/D1; idempotencia de postulaciones, publicaciones y consultas | Nunca duplicar solicitudes ni revelar recibos |
| P2 | Push | Opt-in, recepción, revocación y fallback sin push | Sin notificaciones sin permiso |
| POST-DEMO | Pagos | Conciliación bancaria real, comprobante, antifraude y activación ≤24 h | No activar cobros reales durante demo |

## Secuencia de ejecución
1. Capturar hash de frontend/Worker/staging y build visibles antes de cada prueba; registrar fecha/hora, navegador y dispositivo.
2. Replicar fallo real de video y revisar restricciones del proveedor, errores, fallback y estado del player; corregir sólo en rama aislada.
3. Probar operador Radio Studio y propietario artista con cuentas autorizadas de prueba, nunca con permisos inferidos.
4. Completar TV/IPTV y aceptación física. Para cualquier módulo sin prueba, ocultar promesas o rotularlo *en pruebas* en demo.
5. Repetir pruebas CI y regresiones cruzadas tras cada corrección; separar publicación Pages y despliegue Worker.

## Reglas del producto
Acceso público/gratuito a Bolsa, Cartelera normal y contratación, sin comisión; STREAM+ eliminado; Ticket deshabilitado; reclamo de artista privado; publicidad geolocalizada y PRO/comprobantes reales sólo tras sus propias verificaciones. La plataforma debe ser comprensible para usuarios con poca experiencia digital.

## Evidencia y cautela
Este archivo es una matriz operativa; **no constituye una prueba ejecutada ni certificación de producción**. Las evidencias iniciales proceden de `docs/DEMO-CANDIDATE-CHECKPOINT-20261019.md` y `docs/DEMO-CLOSURE-PLAN-20261018.md`, preservadas en la rama base.
