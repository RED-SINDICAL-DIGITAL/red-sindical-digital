# Radio Studio — release candidate, solo staging

## Prohibiciones
- No modificar `main`, Worker `uadav-api`, D1/KV de producción ni dominios públicos.
- No cambiar automáticamente la rama de Pages `uadav-stream-staging` hasta superar las pruebas.
- No activar `automatic` de emisoras reales. Usar exclusivamente `BEAT DIGITAL RADIO · PRUEBA` y registros ficticios.
- Conservar respaldo identificable del Worker staging desplegado (actualmente version V11.7 / build 11754 según verificación previa) antes de importar un Worker nuevo.
- No copiar secretos de Cloudflare en GitHub ni en capturas.

## Preflight, sin despliegue
1. Ejecutar `node --check worker.js`.
2. Ejecutar `node --test scripts/test-radio-studio-hardening.mjs`.
3. Verificar GitHub Actions verde y confirmar la rama y SHA exactos del candidato.
4. Comprobar que Worker staging sigue enlazado a D1 `uadav-staging-db`, KV `uadav-staging-kv`, y no comparte recursos de producción.
5. Tomar nota de la versión desplegada de Pages y del Worker de staging para rollback.

## Orden de despliegue manual cuando se autorice
1. Publicar **solo** `worker.js` en `uadav-api-staging` desde copia revisada del commit de RC, sin modificar bindings ni secretos.
2. Verificar `/api/health`, D1, KV, CORS y el endpoint nuevo de settings. Si falla, recuperar inmediatamente el Worker anterior.
3. Publicar la interfaz RC en una *preview* de Pages; comprobar que usa únicamente la API staging. No cambiar la producción relativa del proyecto Pages staging hasta validar la preview.
4. Ejecutar pruebas solo con cuenta y radio QA; probar errores antes que aprobaciones automáticas.
5. Tras éxito, integrar a rama Pages staging en cambio separado; producción pública seguirá sin modificaciones.

## Casos de aceptación (observación + logs, no solo tests estáticos)
- Sin sesión: GET `/api/radio-studio/settings` y `/api/radio-studio/moderation` 401/403.
- Operador activo: ver solo su radio; no acceder con otro `radio_id`, ni listar ni revisar IDs de otra emisora.
- Revocar permiso: GET, PUT settings y POST moderación 403/401 en nueva petición; restablecer posteriormente.
- Modo manual: mensaje y pedido ficticios permanecen pendientes hasta aprobar; rechazo no publica.
- Modo automático: contenido benigno se publica cuando corresponde; contenido con URL/contactos y texto largo queda pendiente; sin IA no asumir detección semántica.
- Cambiar automático→manual/pausado durante revisión: no debe iniciarse aprobación automática tardía; revisar también carreras durante operaciones ya iniciadas.
- Modo pausado: envíos públicos nuevos rechazados, historial anterior visible.
- Paginación por cursor: más de 50 pendientes de una sola emisora sin fuga de otra; llegada de nuevos registros no causa duplicados ni pérdidas al avanzar.
- Idempotencia: repetir aprobación no publica dos veces; reintentar después de error no genera segundo pedido.
- Operador: responder chat y manejar pedidos sigue funcionando; estado final 'Sonó' no retrocede.
- Compatibilidad: PC, móvil, tablet, navegación accesible y prueba de consola sin errores.

## Advertencias antes de habilitar automático a público
- Los filtros determinísticos no garantizan detección de acoso, fraude, amenazas ni enlaces ofuscados; mantener un interruptor central de emergencia y canal de denuncia.
- Revisar límites por emisora, concurrencia, auditoría y recuperación de registros `publishing`.
- Los tests de código actuales son estáticos y no certifican ejecución del Worker ni D1.

## Estado
Candidato creado a partir de `audit/radio-studio-hardening-20261020`; no representa despliegue ni aprobación funcional.
