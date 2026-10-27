# Receptor de correo11767.1 · Pages staging

El laboratorio11766 aprobó siete fases D1 según el informe del operador. Worker11767 prepara una recuperación real privada de una oferta ficticia cerrada. Este receptor no habilita recuperación general, entrada de cuentas por correo o Google. Las rutas públicas del Worker continúan503.

## Comportamiento preparado

`acceso-correo.html`, `uadav-email-access.js`, su CSS y `email-access-version.json` forman una pantalla independiente. Funciona solo en Pages staging, con destino API fijo, propósito `job_owner_recovery` e identificadores creados por la QA11767.

El primer script borra el fragmento y la consulta antes de cargar CSS/JS; el token se toma una sola vez y queda en memoria. Abrir el enlace no canjea, inicia sesión, sincroniza una cuenta o guarda vínculos. La confirmación envía un POST. Ante una respuesta perdida, el reintento conserva la misma clave nueva para reconciliar el canje.

Guardar en Mi Perfil requiere la cuenta actual, una elección expresa y el botón. Usa el endpoint transaccional existente con la nueva prueba privada; no busca ni fusiona cuentas por correo. Los cambios de cuenta, incluso A→B→A, descartan respuestas tardías. La consulta de postulantes y la descarga del comprobante privado son opcionales. Salir/pagehide borran la pantalla y cancelan solicitudes. El token y la clave nueva no se guardan en storage o URLs.

## Build y privacidad

El build conserva el script inicial antes de cualquier recurso y omite en esta página el bootstrap/banner general de staging. Genera una CSP con el hash exacto del script, sin unsafe-inline en las reglas del receptor; conecta solo a la API staging. Aplica no-store, no-referrer y frame-ancestors none tanto a la ruta.html como a la ruta sin extensión. El service worker actual carece de fetch handler y no cambia.

El JSON público11767.1 permite al Worker comprobar que el receptor ya está publicado antes de preparar o enviar. Esa lectura tiene tamaño/tiempo acotados y no lleva secretos. Los datos de postulantes se insertan como texto.

## Pruebas y publicación

151 pruebas Pages, incluidas12 nuevas del receptor y una nueva del build, más avisos y exportación, aprobaron localmente. No se completaron revisión visual o pruebas en dispositivos físicos; Work no envió correos reales.

Publicar desde `audit/continuidad-demo-20261019` en el proyecto Pages staging existente, con su build y variables de staging. El build incluye estos archivos y excluye backend, secretos y docs. No cambiar producción ni mezclar ramas.

La guía completa está en `docs/BOLSA-11767-RECUPERACION-REAL-QA.md` de la rama Worker staging. Tras publicar receptor y Worker11767, la prueba privada pide Admin existente, un Secret de cifrado generado en el propio navegador si falta y autorización de envío al correo propio configurado. Luego se abre el enlace, se confirma y se consulta/copia únicamente el reporte seguro. Nunca compartir tokens, claves o comprobantes privados por chat.

Quedan pendientes el canje real de esta versión, la integración general, identidades de cuenta, políticas de cuota/abuso, backup/retención y los otros bloques de Bolsa. Cron, QA de vencimiento, laboratorios y producción se conservan.
