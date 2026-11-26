# UADAV STREAM · Producción como referencia (26/11/2026)

## Alcance y fuente
Inspección de solo lectura de tres pestañas de producción que ya estaban abiertas en un navegador conectado. No se introdujeron datos, no se pulsaron controles, no se enviaron correos y no se inspeccionaron credenciales. La lectura de una pestaña **no equivale** a inspección de DOM completo, bundle servido, rutas API ni Cloudflare Deployment metadata.

## Observado directamente

1. **Plataforma:** `https://uadavstream.com.ar/app.html?build=12058&view=%2Fusuario.html%3Fvista%3Dcuenta` presenta navegación de escritorio Explorar/Artistas/En vivo/Cartelera/Trabajo, menú móvil Explorar/En vivo/Cartelera/Trabajo/Mi Perfil, un reproductor con cola, aleatorio, repetición, volumen y opciones secundarias, así como radio y acciones de compartir. Las acciones figuran en el árbol de accesibilidad; no se probó su funcionamiento pulsándolas.
2. **Acceso por correo:** `https://uadavstream.com.ar/entrar-correo.html` presenta envío de enlace privado, confirmación, opción de conservar guardados del navegador y aviso de caducidad/uso único. No se envió un email de prueba. No registrar direcciones particulares en auditorías ni tests.
3. **Centro de Control:** `https://uadavstream.com.ar/admin?section=home` se identifica como API **V11.7**, muestra **D1 OK** y origen de API de producción. Es una indicación **visual reportada por esa pantalla**, no una consulta independiente de salud del servidor. Se observó una navegación administrativa extensa y controles de publicación, sin guardar cambios.

## Correlación con GitHub

- En `main` (commit identificado `e368d420756764712eb3f1758042332200356f50`), `app.html` incluye el parámetro **build=12058** y la ruta al portal de artistas; `admin.html` contiene **V11.7**, y `entrar-correo.html` contiene la experiencia de acceso por correo. Coincidencia **de marcadores**, no prueba criptográfica de que los archivos servidos sean los de ese commit.
- El PR #73 es un conjunto de cambios visuales y de QA respecto a `main`. `worker.js` **no está modificado por el PR #73**. El guard de preservación de Worker compara el Worker de `main` con un artefacto staging anterior y detecta una diferencia legítima pendiente de clasificación. No adjudicar ese fallo a la hoja de estilos recién creada.
- La prueba `tests/artist-claim-lifecycle.mjs` espera un borrador pendiente para una cuenta autenticada, mientras el Worker actual ofrece alta propia verificada/publicada si hay cuenta válida y Turnstile. Corresponde separar los escenarios del contrato antes de declarar bug de producción. No desactivar Turnstile.

## Validaciones aún necesarias con entorno operativo

- Abrir el sitio mediante Work/navegador controlado en modo lectura y recopilar el HTML, hashes y cabeceras de **`app.html`**, **`worker.js` solo si existe fuente versionada confiable**, JS de cuenta, CSS y configuración publicada de Pages/Worker. Comparar SHA del deployment con commit GitHub; el parámetro `build` por sí solo no lo demuestra.
- Consultar endpoints de salud/estado sin credenciales privadas y sin modificar datos. Verificar versión activa, D1 y políticas de acceso.
- Con cuentas de laboratorio y autorización, comprobar alta propia, reclamo de artista existente, rechazo, aprobaciones, revocaciones y permisos desde dos dispositivos. No usar perfiles reales para test destructivo.
- Separar fallos **de prueba antigua**, **de integración técnica** y **de producción** con evidencia y resultado reproducible.
- Mantener **NO MERGE / NO DEPLOY** hasta resolver los gates y comprobar pantalla móvil, escritorio y Smart TV. La entrega duplicada al mismo Gmail sigue en observación por separado.

## Resultado de esta auditoría
**Producción consultada parcialmente: sí (pestañas visibles, solo lectura). Commit y endpoints remotos verificados: no.** La evidencia favorece usar la UX publicada como contrato de compatibilidad, no usar un hash congelado sin analizarlo y no imponer comportamientos antiguos de tests al Worker actual.
