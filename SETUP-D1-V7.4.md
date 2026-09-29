# ★ UADAV STREAM V7.4 — D1 + Invidious + automatización sin Make

## 1. Tu captura de Cloudflare: está bien
En el Worker `uadav-api`, el binding debe verse así:

- **D1 database** → variable `DB` → base `uadavstream`
- **KV namespace** → `UADAV_DB`

Eso coincide con el modelo que usa el Worker: D1 se accede como `env.DB`, que es la forma documentada por Cloudflare.

## 2. Inicializar D1
1. Entrá al Admin de ★ UADAV STREAM.
2. Abrí **Prospección / Núcleo D1**.
3. Pulsá **Inicializar D1**.
4. Luego **Ver estado D1**.
5. Debe aparecer `OK` y las tablas.

Cloudflare permite vincular una D1 existente desde **Workers & Pages → tu Worker → Bindings → Add binding → D1 database**, usando el nombre de variable `DB`.

## 3. Después de inicializar
Pulsá **Migrar KV → D1** en la sección de núcleo cuando esa opción esté disponible en tu versión de Admin. La migración copia registros compatibles sin borrar KV.

## 4. Invidious
Invidious permanece activo como proveedor permanente para búsqueda global, prospección y resolución de canales. El Worker prueba varias instancias y continúa con la siguiente si una falla.

## 5. Automatización
Make no es necesario. El Worker registra notificaciones en D1 y las reintenta por Cron cada 10 minutos cuando no hay un canal de entrega disponible. Si configurás `EMAIL_AUTOMATION_URL`, puede entregar los avisos a Google Apps Script/Gmail.

Cloudflare Queues queda opcional: no necesitás crear una Queue para que funcione el sistema básico.
