# Auditoría del seguimiento público de postulaciones — 2026-10-12

## Evidencia del código actual
- `bolsa-trabajo.html` presenta un formulario público para oportunidades y postulaciones.
- `worker.js` expone `POST /api/bolsa_trabajo/postular` con `job_id`, `nombre` y `email` obligatorios. La respuesta incluye `success:true` y `item`, con identificador y estado inicial `pendiente`.
- La colección `postulaciones_trabajo` se persiste en KV y se intenta sincronizar con la tabla D1 `job_applications`.
- `GET /api/bolsa_trabajo/postulaciones` requiere administrador. No se identificó en este recorrido un endpoint público de seguimiento.

## Requisito para una implementación segura
1. Entregar un comprobante con identificador de solicitud y mecanismo privado de consulta. **El ID por sí solo no debe autorizar acceso a datos personales**.
2. Emitir credencial aleatoria de alta entropía por postulación; almacenar solo su hash en servidor, nunca publicarla en listas.
3. Exponer consulta pública restringida al estado de esa postulación con credencial válida, límites de tasa y respuesta genérica ante acceso inválido. No revelar nombre, email ni datos de otras personas.
4. Definir estados y transiciones administrativas auditables: pendiente, en revisión, contactado, seleccionado, descartado, cerrado.
5. Permitir recuperación segura de acceso mediante canal verificado; no enviar estado privado a cualquier email sin verificación.
6. Probar POST, consulta autorizada, token incorrecto, enumeración, cambios de estado y compatibilidad de datos anteriores.
7. Actualizar manual público e interno cuando esté operativo. No anunciar seguimiento disponible antes de validarlo.

## Restricciones
- No se modificó Worker, KV, D1 ni producción en esta auditoría.
- No se han ejecutado pruebas E2E. La implementación requiere revisar el flujo completo de seguridad y despliegue del Worker antes de introducir rutas.

## Implementación en borrador y controles pendientes (2026-10-12)
- El Worker crea credencial aleatoria y almacena su hash; devuelve el secreto una sola vez al crear la postulación.
- La página de Bolsa muestra comprobante y formulario de consulta del estado.
- La lista administrativa omite el hash. El hash permanece en el registro interno KV/D1 y debe excluirse de exportaciones generales y logs.
- El endpoint limita intentos por origen mediante KV (10 intentos, TTL de 600 segundos). **Este mecanismo no es atómico y puede tener carreras o evasión**; configurar reglas de WAF/rate limiting de Cloudflare y probarlas antes de producción.
- Las postulaciones anteriores carecen de credencial privada: no se deben hacer accesibles por identificador solamente. Diseñar recuperación con verificación de titularidad.
- Se agregaron pruebas estáticas de contrato y workflow Node 22; consulta de ejecuciones del commit del workflow: **cero ejecuciones registradas**. No equivalen a pruebas E2E.
- Pendiente: probar POST real, clave correcta/incorrecta, consulta de estados, privacidad, carga simultánea, dispositivos, y persistencia KV/D1; comprobar que la respuesta de alta es compatible con consumidores previos.
- **No fusionar ni desplegar hasta contar con evidencia de CI y pruebas integradas.**

## Validación estática efectuada — 2026-10-12
- Se verificaron cinco contratos directamente contra el contenido de la rama: endpoint, hash, respuesta sin datos personales, omisión de hash en listado administrativo y conexión del formulario; cinco verificaciones positivas.
- Los scripts inline no vacíos de `bolsa-trabajo.html` superaron análisis sintáctico en V8.
- `worker.js` es un módulo ES (`export default`), por lo que no debe comprobarse mediante `new Function`; la verificación correcta está configurada en CI con `node --check worker.js`, pero todavía no se ha observado una ejecución.
- No se ejecutaron pruebas HTTP reales, KV/D1, dispositivos ni WAF. El PR continúa en borrador y no es apto para despliegue todavía.

## Importaciones externas y limpieza previa al lanzamiento
- Se identificó que `/api/admin/federated/import` aceptaba ofertas externas con título y URL, y podía marcarlas activas inmediatamente.
- Cambio propuesto: las ofertas externas nuevas ingresan inactivas y con `revision_pendiente=true`; deben revisarse antes de activarse. Las ya activas no se despublican automáticamente: requieren auditoría selectiva.
- Criterios para revisión: convocatoria artística real, fuente verificable, enlace directo pertinente, fecha vigente, ubicación/modalidad coherente y ausencia de duplicados. Evitar páginas genéricas, directorios y enlaces sin oferta concreta.
- Antes del lanzamiento: respaldo KV/D1, inventario de dependencias y borrado selectivo de usuarios, artistas, eventos, trabajos y postulaciones de prueba. Nunca vaciar KV o D1 completos sin inventario.
- No se efectuó borrado ni despliegue.
