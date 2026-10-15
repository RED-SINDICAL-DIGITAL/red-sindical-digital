# Prueba PRO real en staging — 15/10/2026

## Ejecución en navegador

Admin autenticado mediante browserAuth. Se creó una cuenta sintética desde Soy artista y el perfil QA PRO INTEGRAL 1510 (ART-429d58fde42d4a4786603b45bde6cd2c), especialidad Ilusionismo de prueba, Ciudad ficticia, correo example.invalid. Claim CL-a5be145b855d4019a52805f149049f4d. El perfil se vinculó automáticamente y apareció privado en Mi cuenta; las herramientas gratuitas abrieron en modo consulta.

Desde Admin se otorgó PRO con origen Promoción y vencimiento 16/10/2026 exclusivamente a ese artista sintético. No se creó una orden ni se declaró pago recibido. Admin mostró un PRO activo. Al reabrir las herramientas desde la misma cuenta se habilitó edición sin nuevo enlace de gestión.

Se guardó PRESS KIT QA 1510 · Presentación ficticia para verificar guardado privado y revisión. La recarga conservó el texto. Enviar publicación guardó borrador y lo envió a revisión, sin publicar automáticamente. Moderación recibió MOD-aa8bd21f-1abc-49cd-ba14-ff55fa7db955, artista y claim correctos, revisión 2. Se aprobó exclusivamente ese envío. La presentación quedó aprobada en herramientas. La API pública de Press Kit devolvió 404 antes y después porque el perfil sigue oculto.

## Defecto encontrado y corrección

La interfaz confundía public_json aprobado con disponibilidad pública y ofrecía compartir un perfil oculto. Ahora la carga inicial consulta workspace y perfil privado en paralelo. Las acciones públicas requieren PRO activo, snapshot aprobado, Press Kit habilitado y perfil cuya visibilidad pudo comprobarse. Aprobado pero privado se explica sin ofrecer enlaces públicos. No cambia el backend ni se publica el perfil.

Nueve pruebas de sesión/visibilidad pasan, también workspace-autosave.mjs incluida la cancelación de publicación pendiente tras fallo. Sintaxis correcta. Falta verificar visualmente esta última corrección desplegada. El fallo de red se probó mediante integración local, no se simuló cortando la red del navegador.

## Límites

No verifica pago real ni un banco conectado, publicación final del perfil, hardware móvil/tablet/TV ni reproducción simultánea. Se conserva el perfil sintético y la promoción temporal para continuar. Datos y planes previos intactos; producción y Worker sin cambios.
