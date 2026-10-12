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
