# Despliegue V8.1

## 1. NO crear otra D1
Conservar los bindings existentes:
- DB → uadavstream
- UADAV_DB → KV actual

## 2. Worker primero
Reemplazar el código del Worker por `worker.js` y desplegar.

Comprobar:
`https://uadav-api.uadavstream.workers.dev/api/health`

Debe informar `version: V8.1.0`, `kv: true`, `d1: true` y la API de YouTube habilitada si la key existe.

## 3. Comprobar D1
Entrar al Admin → D1, IA y automatización, o consultar el endpoint protegido `/api/admin/d1/status`.
La V8.1 crea automáticamente las tablas faltantes. Luego usar una sola vez `Migrar KV → D1` para copiar el catálogo histórico. KV NO se borra.

## 4. Evitar ERR_BLOCKED_BY_CLIENT
Recomendado en Cloudflare: asociar al Worker la ruta de la zona:
`uadavstream.com.ar/api/*`

El frontend V8.1 intenta primero `/api/` en el mismo dominio y conserva `workers.dev` como fallback.

## 5. Admin
Reemplazar `admin.html` por el V8.1. Si además existe una copia en KV `admin_html`, mantener ambas iguales.

## 6. Web pública
Subir los HTML, JS, CSS, manifest y service-worker del paquete.

## 7. Migración
Desde Admin:
1. D1, IA y automatización.
2. Confirmar D1 OK.
3. Ejecutar `Migrar KV → D1` una sola vez.
4. Revisar Diagnóstico.

## 8. Automatización
El Worker ya tiene mantenimiento programable y botón manual.
Para automatizar vencimientos, agregar un Cron Trigger al Worker (por ejemplo, una ejecución por hora). El mantenimiento:
- quita destacados cuyo `destacado_hasta` venció;
- cierra oportunidades cuya `fecha_limite` venció;
- reintenta notificaciones pendientes.

El correo seguirá mostrando OFF hasta configurar `EMAIL_AUTOMATION_URL`.

## 9. YouTube / Invidious
No desactivar Invidious. El orden de prioridad permanece:
1. cache
2. Invidious
3. YouTube API oficial únicamente como último fallback
