# Frontend aislado de pruebas — 2026-10-14

## Qué se agregó
`scripts/build-staging.mjs` genera `dist-staging` sin modificar el código fuente.
- Reemplaza los dominios de API y sitio de producción en HTML/JS/CSS/JSON/SVG.
- Inyecta configuración de API antes de los scripts de cada página.
- Redirige llamadas fetch relativas a /api/ al Worker de pruebas una sola vez, conservando Request, método, cuerpo y encabezados.
- Rechaza fetch directo a los dominios de producción.
- Incluye franja visible, robots y X-Robots-Tag noindex.
- Restringe conexiones mediante CSP. Algunos proveedores multimedia externos pueden quedar bloqueados intencionadamente hasta revisar su dominio.
- Excluye worker.js, archivos de despliegue con prefijo _, CNAME, docs, tests, migrations, releases y archivos de entorno. Solo publica archivos web de raíz y assets/vendor.
- Genera staging-build.json con commit de Cloudflare y hashes de los archivos.
- No sobrescribe una salida existente; necesita checkout limpio.
- No despliega ni modifica Cloudflare.

No garantiza aislamiento de cada recurso multimedia externo: img/media permiten fuentes HTTPS para contenido. La protección de API se apoya en transformación, fetch y connect-src sin comodín HTTPS. No copiar datos ni credenciales de producción.

## Crear proyecto separado en Cloudflare Pages
Esta operación debe realizarse en la cuenta donde está el Worker staging. El acceso de navegador del asistente no está autenticado.

Crear un proyecto **Pages**, no reemplazar el proyecto público:
| Campo | Valor |
| --- | --- |
| Nombre | uadav-stream-staging |
| Repositorio | RED-SINDICAL-DIGITAL/red-sindical-digital |
| Rama del proyecto de pruebas | audit/public-job-status-20261012 |
| Framework | None / Ninguno |
| Build command | node scripts/build-staging.mjs |
| Build output directory | dist-staging |
| Variable UADAV_STAGING_ORIGIN | https://uadav-stream-staging.pages.dev |
| Node | 22 o superior |

No usar main, dominios personalizados ni el proyecto de producción. Si el nombre no está disponible, detenerse: el origen está restringido intencionadamente y debe ajustarse en código, pruebas y configuración antes de usar otro.
La rama audit puede actuar como rama principal del proyecto Pages separado. Las URLs temporales con prefijo de commit no están habilitadas por esta versión del bootstrap: usar el hostname exacto de arriba.

## Configurar únicamente el Worker uadav-api-staging
En variables del Worker de pruebas:
| Variable | Valor |
| --- | --- |
| ACCOUNT_ALLOWED_ORIGINS | https://uadav-api-staging.uadavstream.workers.dev,https://uadav-stream-staging.pages.dev |
| PUBLIC_SITE_URL | https://uadav-stream-staging.pages.dev |
| TURNSTILE_ALLOWED_HOSTNAMES | uadav-stream-staging.pages.dev,uadav-api-staging.uadavstream.workers.dev |

Conservar DB, UADAV_DB y ADMIN_KEY de pruebas. No agregar secretos de producción. Si Turnstile está activo, requiere un widget de pruebas autorizado para ese hostname; cambiar la variable no configura por sí solo el widget. No activar cobros, correos, Push ni inscripciones públicas.

## Validación después de publicar
1. Abrir https://uadav-stream-staging.pages.dev/staging-build.json y registrar sourceCommit.
2. Comprobar franja PRUEBAS, cabecera CSP y noindex en respuesta HTTP. Pages debe aplicar _headers.
3. En Network, confirmar que cuentas y artistas se comunican con uadav-api-staging; ninguna petición de API debe ir a uadav-api.
4. Crear cuenta ficticia y artista de prueba. Probar guardar, volver a abrir, renovar y cambiar de cuenta.
5. Vincular dos navegadores y comprobar sincronización y revocación.
6. En Admin usar únicamente la clave de pruebas. No introducir la clave real.
7. Registrar errores de CORS/CSP y dominio exacto antes de ampliar permisos. No habilitar connect-src https: para resolverlos.

## Evidencia al preparar
Cuatro pruebas locales verifican orígenes, transformación, exclusión de backend y conservación de una escritura relativa sin duplicación.
La primera compilación real del repositorio en Actions terminó correctamente (run 38646360818). La variante posterior que incorpora el enrutamiento fetch también terminó satisfactoriamente: run 38646454633, incluidas las cuatro pruebas y la compilación del repositorio completo.
Esto no prueba todavía el sitio publicado, CSS responsive, navegación real, cámara QR, reproducción ni Smart TV.
