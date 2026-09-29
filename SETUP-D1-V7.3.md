# ★ UADAV STREAM V7.3 — D1 sin terminal obligatoria

## Opción recomendada para Marcos: Cloudflare Dashboard

1. Entrá a Cloudflare.
2. Abrí **Workers & Pages → D1 SQL Database**.
3. Elegí **Create database**.
4. Nombre sugerido: `uadavstream`.
5. No hace falta crear tablas manualmente todavía.

Después:

6. Abrí tu Worker `uadav-api`.
7. Entrá a **Settings / Bindings**.
8. **Add binding → D1 database**.
9. Variable name: `DB`.
10. Seleccioná la base `uadavstream`.
11. Guardá y desplegá el Worker V7.3.

## Inicializar las tablas

Una vez vinculado `DB`, ingresá al Admin con tu clave.

Abrí:

**CONTENIDO → Prospección**

y presioná:

**Inicializar D1**

Esto ejecuta el esquema protegido dentro del Worker. El endpoint está bloqueado por `ADMIN_KEY`.

Luego presioná:

**Ver estado D1**

Debe indicar `OK` y mostrar las tablas creadas.

## Alternativa con Wrangler

Si más adelante querés usar terminal:

```bash
npx wrangler d1 create uadavstream
```

Wrangler devuelve el `database_id` y puede agregar automáticamente el binding al archivo de configuración.

Para aplicar una migración versionada:

```bash
npx wrangler d1 migrations apply uadavstream --remote
```

O ejecutar directamente un SQL:

```bash
npx wrangler d1 execute uadavstream --remote --file=./schema-v7.3.sql
```

## Migración V7.3

La migración incremental está en:

`migrations/0002_cartelera_prospeccion.sql`

Agrega:

- venues
- event_occurrences
- search_restrictions
- prospecting_runs
- prospecting_results

## Regla de seguridad

No expongas nunca `database_id`, `ADMIN_KEY`, `GEMINI_API_KEY` ni otras claves en HTML público.

La creación de la base puede hacerse desde Dashboard; el Worker solamente necesita el binding `DB`. Cloudflare documenta que una D1 creada debe vincularse al Worker y que el binding queda disponible como `env.DB`. También documenta `d1 execute` y las migraciones versionadas. 
