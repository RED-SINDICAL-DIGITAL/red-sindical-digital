# Sincronización real de dos clientes · 4/11/2026

## Resultado: complete
Se ejecutó el cliente real uadav-account-sync.js en dos contextos de JavaScript con almacenamiento independiente contra https://uadav-api-staging.uadavstream.workers.dev/api/. Sin mocks de las respuestas HTTP, sin usar una cuenta personal y sin leer credenciales del navegador. Las credenciales sintéticas se generaron y usaron solo en memoria; no se imprimieron ni se guardaron en el repositorio.

Aprobado:
1. Crear una cuenta ficticia identificada QA · Sincronización dos clientes · NO USAR.
2. Vincular el segundo cliente con aprobación del primero y credenciales independientes. Antes de aprobarlo no figura vinculado.
3. Guardar favorito mediante uadav:library-change en A y recuperarlo en B.
4. Guardar una playlist en B y recuperar su contenido en A.
5. Cambiar favoritos de forma incompatible: B conserva su edición local y presenta conflicto; solo la elección explícita cloud aplica el resultado remoto.
6. Revocar el segundo cliente: pierde acceso, conserva su playlist local.

Una cuenta sintética queda retenida en staging; el acceso del segundo cliente fue revocado. No se eliminaron cuentas ni se rotaron credenciales de usuarios existentes. No se modificó producción ni se envió correo.

## Alcance exacto
Son dos clientes independientes contra la API desplegada y D1 operativo; no son dos navegadores físicos ni una prueba visual/audible de PC y celular. La prueba del evento de guardado usa el debounce real y las verificaciones posteriores leen los datos devueltos por la API real.

El runner requiere UADAV_RUN_REMOTE_QA=yes para ejecutar y fija el origen exclusivamente a staging. No incorporarlo a pruebas rutinarias de CI: crea una cuenta ficticia por ejecución. Resultado reducido sin secretos en docs/evidence/two-client-sync-20261104.json.

## Cierre restante
Recuperación HTTP real y vencimiento remoto de destaque quedaron aprobados y documentados previamente. Esta prueba cierra la comprobación real del protocolo de vinculación/sincronización/conflictos/revocación. Siguen pendientes PC y celular físicos, audio continuo entre secciones y segundo plano, y selección editorial de contenidos vigentes para presentar. No se habilitó recuperación pública ni producción.
