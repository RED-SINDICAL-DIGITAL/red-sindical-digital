# Sesiones persistentes · Worker 11753

## Qué cambia

- Los dispositivos aprobados mantienen la cuenta activa sin vencimiento automático.
- Los dispositivos anteriores que sigan autorizados pasan al mismo estado al iniciar el Worker actualizado.
- El artista vinculado a la cuenta permanece disponible en sus dispositivos.
- Las sesiones técnicas cortas del artista se renuevan automáticamente mientras la cuenta siga autorizada.
- La persona puede cerrar o revocar un dispositivo desde **Mi perfil → Configuración y dispositivos → Mis dispositivos**.
- Los QR y códigos para vincular un dispositivo nuevo siguen venciendo a los cinco minutos.
- Eliminar la cuenta o revocar un dispositivo sigue cortando el acceso.

El enlace privado sirve para vincular o recuperar un artista. Una vez vinculado, la persona entra desde **Mi perfil**; no necesita volver a guardar ese enlace.

## Despliegue

En Cloudflare, reemplazá el código del Worker por [`worker-UADAVSTREAM-V11.7-11753.js`](../releases/worker-UADAVSTREAM-V11.7-11753.js). Conservá los bindings y secretos existentes. No borres KV, D1, cuentas ni dispositivos.

Después del despliegue, comprobá `/api/health`: debe indicar `build: 11753`, `kv: true` y `d1: true`.

## Verificación realizada

La prueba integrada crea y vincula PC y teléfono, confirma sesiones sin vencimiento, simula más de un año de uso, sincroniza los datos y verifica que la revocación del dispositivo siga funcionando.
