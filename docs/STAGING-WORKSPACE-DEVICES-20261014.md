# Herramientas privadas y dispositivos — 14/10/2026

## Reparación

La precarga para completar campos vacíos del Press Kit dependía del endpoint público; un artista privado recibía 404. Se usa ahora artista/access con su sesión privada, renovación única ante 401, comprobación de cuenta y validación de identidad anidada artist.id. Una respuesta de otro artista se rechaza. No se sobrescriben campos existentes ni se publica automáticamente. Commit de implementación: 8cd27159439bed03958c38e69317a5f15bc3ac1a.

## Pruebas

- Siete pruebas de sesión/herramientas pasan, incluidas renovación del token de consulta y rechazo de respuesta de otro artista. Sintaxis inline correcta.
- Manifest remoto confirmó el commit de implementación desplegado en Pages staging.
- Navegador: PRUEBA VISUAL QA 2235 abre sus herramientas privadas, sus enlaces Mi perfil y Consultas incluyen el artist_id correcto. El botón Completar campos vacíos con mi perfil aparece tras la lectura privada; sin PRO vigente queda deshabilitado, al igual que edición y publicación. No se probó la edición PRO desde esta cuenta gratuita.
- Ejecución remota de tests/staging-device-integration.mjs contra uadav-api-staging: PASS. Cliente real de sincronización y D1 remoto; aprobación del segundo dispositivo, credenciales independientes, sincronización bidireccional de datos ficticios, permisos persistentes sin vencimiento programado, revocación del segundo dispositivo y conservación de datos locales. Se retuvo una cuenta sintética; no se eliminaron datos existentes ni se imprimieron credenciales.

## Pendiente

Inspección visual Admin autenticada; edición y publicación de Press Kit con PRO activo y moderación; integración de pago verificado y recuperación; pruebas físicas tablet/Smart TV. La simulación de dispositivos valida el circuito de datos, no reemplaza las pruebas visuales en hardware. Producción, main y Worker no se modificaron.
