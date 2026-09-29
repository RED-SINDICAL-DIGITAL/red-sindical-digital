# ★ UADAV STREAM · V7 · D1 + IA + Automatización

## Qué cambia

La plataforma mantiene KV para configuración y compatibilidad, pero D1 pasa a ser la nueva base estructurada para artistas, productoras, eventos, radios, bolsa, postulaciones, contratos, campañas, notificaciones y auditoría.

## 1. Crear D1

En Cloudflare Dashboard:

**Workers & Pages → D1 → Create database**

Nombre sugerido:

`uadavstream`

Anotá el **Database ID**.

## 2. Ejecutar el esquema

Desde Wrangler:

```bash
npx wrangler d1 execute uadavstream --remote --file=./d1-schema.sql
```

## 3. Conectar el Worker

Copiá `wrangler.toml.example` a `wrangler.toml` y completá:

- `KV namespace ID`
- `D1 database ID`

## 4. Secrets opcionales

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GROQ_API_KEY
npx wrangler secret put EMAIL_AUTOMATION_URL
npx wrangler secret put EMAIL_AUTOMATION_SECRET
```

No se guardan estas claves en HTML ni en GitHub.

## 5. IA

Gemini es el proveedor principal. Groq queda como fallback.

Endpoints de administración:

- `POST /api/v7/ai/normalize`
- `POST /api/v7/ai/assistant`

## 6. Migración inicial

Después de conectar D1 y desplegar el Worker:

**Admin → V7 · Núcleo, IA, D1 y automatización → Migrar KV → D1**

La migración no elimina KV.

## 7. Automatización de correo

Usar `automation-google-apps-script.md`.

Configurar los secretos:

`npx wrangler secret put EMAIL_AUTOMATION_URL`

`npx wrangler secret put EMAIL_AUTOMATION_SECRET`

Opcionalmente crear la cola `uadavstream-notify` y desplegar con el binding del `wrangler.toml.example`.

La automatización interna es nativa de Cloudflare y no depende de un orquestador externo.



Crear en Google Apps Script:

**Webhooks → Custom webhook**

Ese webhook recibe los eventos de UADAV STREAM y puede enviarlos a Gmail.

Ejemplos:

- ARTIST_APPROVED
- EVENT_PUBLISHED
- EVENT_FEATURED
- RADIO_APPROVED
- JOB_APPLICATION
- CONTRACT_REQUEST

## 8. WhatsApp

Make quedó fuera de la arquitectura. Los avisos se encolan en D1 y el Worker los reintenta por Cron; el canal de email puede ser Google Apps Script/Gmail mediante `EMAIL_AUTOMATION_URL`. Para WhatsApp se deja preparado un enlace `wa.me` hasta que exista una cuenta oficial de Meta y presupuesto para la API.

Mientras tanto, el sistema debe priorizar email y enlaces `wa.me` preparados.

## 9. Seguridad

La IA no debe recibir datos sindicales sensibles, cuotas ni comprobantes. La IA propone y clasifica; las decisiones administrativas sensibles permanecen en manos de la administración central.
