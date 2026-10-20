# Radio Studio RC — laboratorio aislado sin rollback disponible
## Motivo
El panel Cloudflare del Worker uadav-api-staging muestra historial pero no ofrece una acción visible para restaurar la versión previa. No sobrescribir el Worker staging mientras no exista respaldo recuperable.

## Arquitectura de laboratorio recomendada
- Nuevo Worker **uadav-api-radio-lab** (nombre de propuesta; crear solo cuando el usuario autorice desde Cloudflare).
- Nueva base D1 **uadav-radio-lab-db** y nuevo namespace KV **uadav-radio-lab-kv**; nunca apuntar el Worker laboratorio a uadav-staging-db, uadav-staging-kv o recursos de producción.
- Inicializar datos de prueba: emisora **RADIO QA LAB · NO EMITIR**, cuenta de operador de pruebas y permisos; no copiar datos de audiencia real ni secretos.
- Separar tokens y ADMIN_KEY de laboratorio; no exponerlos en GitHub, capturas ni chat.
- UI de Radio Studio desde una preview que apunte explícitamente al Worker laboratorio; el fallback actual de radio-studio.html se dirige a API staging o producción según hostname, así que NO publicar la interfaz sin resolver primero la URL de API para la preview.

## Orden seguro
1. Crear D1 y KV de laboratorio desde Cloudflare.
2. Crear Worker laboratorio y enlazar solamente D1/KV lab.
3. Publicar Worker candidato exclusivamente en laboratorio tras verificar configuración y secretos necesarios.
4. Health y rutas de cuenta/moderación; datos ficticios; probar Manual, Automático, Pausado.
5. Verificar permisos cruzados con segunda emisora y segunda cuenta ficticias y revocación.
6. Realizar revisión de seguridad/antispam y controlar concurrencia y duplicados.
7. Solo entonces planificar actualización del staging existente con respaldo exportado y comprobado. Producción nunca se modifica sin autorización.

## Riesgos conocidos
- Los tests GitHub actuales son principalmente estáticos.
- Filtros determinísticos permiten falsos negativos; uso público automático prohibido hasta ensayo.
- No asumir que el panel permite rollback por conservar historia.
- No compartir bindings D1/KV con staging: este laboratorio debe ser aislado también en los datos.
