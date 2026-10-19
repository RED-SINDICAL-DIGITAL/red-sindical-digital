# Estado de integración — 15/10/2026

## Código y despliegue

Comparación GitHub consultada: main d5cba094d8752d90fd4d7307594520601e055dd7; rama audit/public-job-status-20261012 en c12dca1fcda3b276d8ee7b7a449afe45eda64092, 284 commits adelante y 0 detrás, 124 archivos cambiados. Este documento agrega un commit posterior. PR #12 actualizado y conservado como borrador, abierto y sin fusionar. Main no demuestra qué está desplegado en producción.

Frontend de staging se publica desde la rama de auditoría. Worker de staging se actualiza por separado; última fuente identificada b040e6f758c6aa7627b1650e4ec78c2eaf53a03f. No hubo nuevos cambios del Worker en las últimas correcciones de UX. Producción no modificada; identidad y comportamiento actuales de producción sin certificar.

## Evidencia vigente

| Circuito | Evidencia | Límite |
| --- | --- | --- |
| Cuenta/dispositivos | Integración remota staging: vinculación, sincronización, revocación | Contextos VM; cámara y dispositivos físicos pendientes |
| Artista privado | Creación/enlace y borradores en staging; acceso recuperado en navegador | No certificar todos los reclamos y migraciones históricos |
| PRO/presentación | Navegador: PRO habilita herramientas y conserva presentación privada aprobada | No pago bancario real; perfil ficticio oculto |
| Presupuesto/agenda | Navegador: autosave, recarga, total/saldo, nota interna excluida, fecha/hora y sin duplicados | PDF exportado sin verificar |
| Vencimiento/reactivación PRO | Worker real + SQLite: conserva datos, bloquea escritura, recupera edición | Sin simular cobro real ni alterar suscripciones desplegadas |
| Contrataciones | Worker real + SQLite: entrega privada, estados, avisos e idempotencia | Formulario público hasta bandeja en Cloudflare aún sin completar |
| Admin | Sesión real, 7 pendientes coinciden; moderación legible | Inspección visual multidispositivo completa pendiente |
| Pagos | Adaptador HMAC simulado, idempotencia y recuperación | Banco no conectado; comprobante no equivale a acreditación |
| Radio/TV | Contratos y pruebas locales de revisión/recuperación | Concurrencia D1/KV y reproducción real pendientes |
| Búsqueda, Cartelera, Bolsa, publicidad, Push | Código e inventario previo | No certificados como circuitos completos por estas pruebas |

## Orden de cierre

1. Completar pruebas remotas D1/KV y recuperación ante interrupciones; revisar cruces entre D1 y KV sin prometer atomicidad global.
2. Completar contratación pública hasta bandeja privada con datos sintéticos, permisos y recuperación; sin enviar mensajes externos.
3. Validar móvil/tablet/PC/TV y exportación PDF; no sustituir hardware por pruebas unitarias.
4. Revisar búsqueda/reproducción y Cartelera/Bolsa de extremo a extremo.
5. Cerrar configuración/entrega de Push, IA de moderación y banco cuando existan sus integraciones; sin activar cobros ficticios.
6. Confirmar Actions de la revisión final y preparar frontend/Worker, respaldo y reversión separados para aprobación expresa de producción.

No fusionar automáticamente por cantidad de pruebas o estado mergeable. No cerrar PR anteriores sin comparar sus cambios; publicidad territorial PR #11 continúa como base sin integración comercial completa.
