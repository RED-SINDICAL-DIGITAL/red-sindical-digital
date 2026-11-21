# Actualización de staging — 14 de octubre de 2026

## Entrega revisable
- Código fijado: `cbeddcd5ca50ddcfc1ccdf5d25f45a9da1bf0432`.
- Rama: `audit/public-job-status-20261012`.
- Worker blob Git: `6876e049660193efba82ac9266186230eadb50a9`.
- Worker SHA-256: `a4c386967c1c52d7d0ff3c2eda385771fb9c651f5384c024e1ceb7253af95293`.
- [Worker completo, versión fija](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/blob/cbeddcd5ca50ddcfc1ccdf5d25f45a9da1bf0432/worker.js).
- [Worker en texto](https://raw.githubusercontent.com/RED-SINDICAL-DIGITAL/red-sindical-digital/cbeddcd5ca50ddcfc1ccdf5d25f45a9da1bf0432/worker.js).
- [Frontend de la misma entrega](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/tree/cbeddcd5ca50ddcfc1ccdf5d25f45a9da1bf0432).

No es una autorización para desplegar producción. Actualizar solo el Worker de pruebas existente.

## Antes de actualizar
1. Cloudflare → Workers & Pages → **uadav-api-staging**. Comprobar el nombre completo; no elegir uadav-api.
2. Confirmar que el Worker conserva DB → uadav-staging-db y UADAV_DB → uadav-staging-kv. Si no coinciden, detenerse.
3. Registrar la versión actualmente desplegada para reversión y conservar una exportación de los datos de pruebas si se necesita restaurar su estado exacto. Revertir código no revierte D1/KV.
4. Conservar ADMIN_KEY de pruebas. No copiar claves de producción.
5. Mantener cerradas las inscripciones y desactivadas integraciones con efectos reales. No asociar dominios de producción.
6. El Worker incluye inicializaciones de tablas bajo demanda. No borrar ni sustituir la base de pruebas; no ejecutar SQL sobre producción.

## Actualización manual del Worker
1. Abrir el enlace de Worker en texto de arriba y copiar el archivo completo.
2. En **uadav-api-staging**, elegir Edit code / Editar código.
3. Sustituir únicamente el contenido del módulo Worker; no modificar bindings, variables ni secretos.
4. Verificar de nuevo el nombre **uadav-api-staging** antes de pulsar Deploy.
5. Abrir https://uadav-api-staging.uadavstream.workers.dev/api/health y comprobar KV y D1.
6. Ejecutar la comprobación de lectura indicada abajo.
7. Si falla, conservar el error sin datos personales y volver a la versión previa desde Deployments. No intentar reparar producción.

El número 11753 no identifica de forma única el código. Un health correcto comprueba disponibilidad, pero no demuestra que el archivo nuevo esté desplegado. Verificar la nueva versión en Deployments y comprobar los circuitos modificados.

## Comprobación sin escrituras
Desde la raíz del repositorio de esta entrega:
```bash
UADAV_STAGING_API='https://uadav-api-staging.uadavstream.workers.dev/api/' node tests/staging-readonly-smoke.mjs
```
Comprueba salud, inscripciones cerradas y denegación anónima de rutas privadas. No necesita ADMIN_KEY.

## Frontend: publicación independiente pendiente
Actualizar el Worker NO actualiza las páginas públicas. No publicar esta rama sobre el dominio público.

Antes de crear una publicación de frontend de pruebas:
- Sustituir y verificar todas las bases API y destinos de fallback para que apunten solo al Worker de pruebas.
- Revisar URLs absolutas, vínculos compartidos, origen de cuentas y scripts cargados dentro de iframes.
- Configurar los orígenes permitidos únicamente para las URLs de pruebas verificadas.
- Añadir indicador visible de pruebas y bloqueo de indexación.
- Usar cuenta y navegador de pruebas sin credenciales de producción.
- Comprobar en Network que no hay peticiones a la API de producción antes de introducir datos.

El archivo wrangler.staging.toml.example es una plantilla: sus IDs son marcadores, no una configuración lista para desplegar. No sustituirlos con IDs de producción.

## Pruebas realizadas en esta revisión
- 59 pruebas locales de contratos y helpers: satisfactorias.
- 12 suites locales de integración con Worker y almacenamiento simulado/SQLite: satisfactorias.
- Scripts de las cinco páginas con referencias actualizadas: sintaxis comprobada.
- GitHub Actions de la integración de sesiones d15ea2d: dos workflows satisfactorios. Los commits posteriores de referencias deben comprobarse por separado.
- Estas evidencias no sustituyen la ejecución del frontend nuevo y Worker nuevo juntos en Cloudflare.

## Circuito después de publicar frontend aislado
1. Crear cuenta sintética A y artista sin YouTube.
2. Abrir Mi perfil → Mi artista; editar y guardar.
3. Vincular otro navegador con QR/código; comprobar mismo artista y sincronización.
4. Renovar sesión y confirmar que permanece el artista abierto.
5. Cambiar a cuenta B con el editor de A abierto: ninguna lectura privada ni escritura de A debe continuar.
6. Revocar acceso y confirmar rechazo, sin reintentos que recuperen permisos revocados.
7. Enviar consulta sintética y verificar llegada al artista correcto; reintentar no debe duplicar.
8. Simular PRO con datos de pruebas: comprobante no equivale a pago confirmado. Confirmación autorizada debe habilitar solo el producto correspondiente y ser idempotente.
9. Verificar Press Kit público, campos ocultos, caducidad PRO y separación de datos privados.
10. Registrar PC/móvil/tablet/TV por separado. Simulación de tamaños no demuestra funcionamiento en Smart TV.

## Límites todavía abiertos
- No hay frontend aislado desplegado y verificado en esta entrega.
- No hay proveedor bancario real conectado ni reproducción de streams autorizados comprobada aquí.
- Un put KV ya iniciado puede finalizar tras vencer un lease; otros escritores de catálogos requieren revisión.
- Falta ampliar auditoría a todos los endpoints, módulos y dispositivos. La plataforma no se declara terminada.
