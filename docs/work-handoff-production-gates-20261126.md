# UADAV STREAM — Instrucciones para Work / Cloudflare (26/11/2026)

## Estado
- Producción es **referencia funcional oficial**. Regla: «Menos pantallas, menos elementos innecesarios, más experiencia de aplicación y ninguna pérdida de funciones».
- PR #74: `audit/production-baseline-simplify-20261126` — limpieza visual incremental de Admin, Mi Perfil, Explorar, Cartelera y Trabajo; sin merge ni deployment.
- PR #73: `ux/app-native-shell-20261126` — capa de apariencia app nativa; también sin merge.
- PR #70 (correo), #71 (biblioteca), #72 (reanudar) sin merge. **No unir todo a ciegas**. Primero comprobar dependencias e interacciones.
- La QA de PR #74 registró por una parte PASS para reproductor unificado de radio en móvil/desktop/laptop/TV; se corrigió doble resumen de filtros en Cartelera; la prueba de ilustraciones se actualizó para el selector que pasó de 15 a 14 destinos al fusionar En vivo + Radio. La última corrida completa de esa actualización debe comprobarse.
- Las pruebas de contrato laboral y Bolsa han aprobado; la integración de `tests/artist-claim-lifecycle.mjs` falla en HTTP 503 porque el test presupone un flujo viejo sin Turnstile habilitado; la lógica de alta nueva con cuenta puede publicar automáticamente si hay verificación y propiedad. **Nunca desactivar Turnstile para conseguir una prueba verde.**
- El gate `tests/staging-profile-preservation.test.cjs` compara un hash de `worker.js` de staging obsoleto (`d4b68445e67b754b811b93d84a9b7225233e67b3`) con el hash actual de `main` (`cb2df152bcdf01e659624b409461429ceceb39f9`). La política exige investigar en vez de actualizar el hash arbitrariamente.

## Tareas seguras en Work, en este orden
1. **Solo lectura:** Cloudflare Pages UADAV Stream: identificar proyecto, deployment de producción, commit SHA GitHub y fecha; Workers API: script/version, rutas, entorno y fecha de deployment. Registrar identificadores de release que realmente responden en `https://uadavstream.com.ar/`. Sin exportar ni publicar secretos.
2. Comparar el commit servido contra `main` y las ramas PR #70–#74. Verificar si producción tiene cambios no pasados al repositorio. No reemplazar código activo por una rama anterior.
3. Obtener evidencia de endpoints públicos `health` y versiones de API sin escritura y sin credenciales; confirmar vínculos de D1 y KV por nombres/metadatos (no descargar datos privados). Catalogar flags publicados.
4. **QA aislada en staging, sin tocar datos reales:** roles visitante, cuenta por correo, artista propio, tercero sin permiso, contratante y Admin; revisar acceso, reanudación, favoritos, radio de fondo, chat, ofertas, eventos, publicaciones y reversibilidad. Solo datos sintéticos y nunca claves reales; no usar PRs pendientes como fuente de verdad.
5. Corregir o separar test de alta artística verificada y reclamo de perfil existente con mocks de Turnstile **en tests**, preservando la verificación real en Worker. Validar propiedad con dos cuentas diferentes.
6. Comparar funcionalmente `worker.js` base de staging y código desplegado, identificar cuándo divergen y explicar los cambios. Solo actualizar baseline de preservación tras aprobación de equivalencia y evidencia de procedencia.
7. Ejecutar pruebas completas de PR #74 y QA visual móvil 320/390, desktop, laptop y TV; medir 0 elementos cortados, superposición player/nav, lectura fácil, clics accesibles y ausencia de pérdida de funciones.
8. Preparar matriz **conservar / fusionar / ocultar / eliminar** con evidencia de uso y dependencias. **No borrar endpoints, D1, KV, datos, código de migración o backups por limpieza estética.**
9. Preparar el orden de integración y rollback, sin hacer merge/deploy hasta revisión explícita de gates críticos.

## Bloqueos para producción
- SHA exacto publicado y paridad GitHub/Cloudflare sin confirmar;
- prueba de titularidad y registro artístico con Turnstile pendiente;
- preservación del Worker pendiente de reconciliación;
- pruebas end-to-end de permisos y sincronización pendientes;
- QA completa de UX en PR #74 aún sujeta a última ejecución.

No pedir credenciales del administrador, Cloudflare, correo o cuentas en el chat. En Work usar únicamente sesiones/conectores autorizados existentes. Registrar resultados en el PR.
