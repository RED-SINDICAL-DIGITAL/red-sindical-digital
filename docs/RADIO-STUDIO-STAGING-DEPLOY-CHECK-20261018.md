# Radio Studio: comprobación tras despliegue manual — 18/10/2026

Usuario confirmó despliegue de Worker en staging. No se modificó producción.

## Comprobado remoto
- Health responde ok con D1/KV y YouTube disponibles. Gemini/Groq sin clave: moderación requiere revisión manual.
- GET radio-studio, radio-studio/requests y radio-studio/chat sin credencial: 401 Acceso privado requerido.
- GET admin/radio-operators sin credencial: 401 No autorizado.
- Respuestas privadas no-store en rutas de Studio observadas.
- Página radio-studio muestra acceso por Mi perfil cuando no hay cuenta vinculada.
- Ingreso Admin por browserAuth satisfactorio, confirmado visualmente en dashboard.
- Admin > Radio > Operadores: carga BEAT DIGITAL RADIO · PRUEBA, lista sin operadores, búsqueda QA encuentra QA CONTENT INTEGRATION, selección prepara confirmación con verificación y motivo. Botón de habilitar desactivado antes de completar requisitos.
- Cancelar y Volver a Radios funcionan. No se habilitó ni revocó ningún operador; no hubo mensajes remotos ni pedidos nuevos.

La revisión visual detectó campos sin estilo; se añadió CSS específico para el panel. Esta mejora de frontend no requiere redeploy Worker; verificar entrega de Pages aparte.

## Pendiente
Sesión autenticada de cuenta de operador y confirmación explícita de su permiso para recorrer perfil → Studio → pedido/chat → revocación. No se crean cuentas alternativas ni se recurre a extracción de credenciales del navegador.
El mismo build 11753 no identifica el código exacto por sí solo. Nuevas rutas y Admin confirman comportamiento compatible con lo desplegado; no equivalen a verificar hash binario de Cloudflare.
No se certifican todavía pruebas de operador entre dispositivos, concurrencia D1/KV ni vistas móviles físicas.
