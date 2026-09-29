# ★ UADAV STREAM V7.4.1

## Configuración Cloudflare
La captura del Worker es correcta si aparece:

- D1 database → `DB` → `uadavstream`
- KV namespace → `UADAV_DB`

No crear otra D1.

## Importante: Admin 401
El Admin ahora guarda la clave después de `admin_check` y la utiliza para todas las llamadas privadas. La variable secreta `ADMIN_KEY` del Worker debe ser exactamente la misma clave que se ingresa en el Admin.

Después de desplegar el Worker y actualizar `admin_html` en KV, cerrar sesión e ingresar nuevamente la clave.

## Protección de cuota de YouTube
El modo predeterminado es:

`Invidious primero / YouTube oficial apagado`

La API oficial solo se activa desde Admin → Prospección → Protección de cuota YouTube.

Invidious se usa para:
- búsqueda global;
- prospección;
- trending;
- resolución de canales;
- importación de perfiles.

## D1
Con el binding `DB` listo:
1. Admin → Prospección.
2. Inicializar D1.
3. Ver estado D1.
4. Migrar KV → D1 cuando corresponda.

## Despliegue
1. Desplegar `worker.js`.
2. Mantener `DB` → `uadavstream`.
3. Mantener `UADAV_DB`.
4. Actualizar el HTML `admin.html` que se guarda en la clave KV `admin_html` si el Worker sirve el Admin desde KV.
5. Volver a entrar al Admin.
6. Verificar `D1 = OK`.
7. Verificar `Invidious primero · API oficial apagada`.
