# Cuenta, QR y dispositivos · 11728

## Uso

1. Desplegar `worker.js` en el Worker existente, conservando KV, D1 y variables. Verificar `/api/health`: build 11728 y d1 true.
2. En Mi cuenta, activar la cuenta y elegir Vincular otro dispositivo.
3. Escanear el QR o ingresar los seis números en el dispositivo destino.
4. Comparar los cuatro números de verificación y aprobar en el origen.
5. En Mis dispositivos, revocar permisos que ya no se usen.
6. Guardar el respaldo de recuperación de manera privada. Si se pierde el equipo que lo guardaba, revocar ese equipo y renovar el respaldo desde otro equipo autorizado.

## Seguridad implementada

- Permisos individuales aleatorios de 256 bits. El QR transporta una invitación aleatoria temporal, nunca la credencial raíz.
- Caducidad de invitación: 5 minutos; autorización explícita del origen; aprobación transaccional en D1; imposibilidad de reutilizar la misma invitación para otro permiso.
- Código corto de seis dígitos con generación uniforme. No concede acceso sin aprobación del origen y comparación de los cuatro dígitos.
- SQL parametrizado. Límites de intentos mediante incremento condicional atómico en D1: 8 solicitudes por IP / 10 minutos; 10 invitaciones por IP / hora; 10 cuentas nuevas por IP / hora; 3 cambios de respaldo por IP / hora.
- Límite de 20 permisos activos por cuenta. Sesiones de lectura con `first-primary` cuando D1 lo ofrece; evita leer estados viejos de revocación desde una réplica.
- Credenciales, códigos temporales y secretos QR guardados como SHA-256. IP usada sólo como huella dentro de la clave temporal de limitación, sin almacenar la IP literal en nuestras tablas. El proveedor puede conservar sus propios registros.
- Permisos revocables y vencimiento de un año. Respaldo de recuperación renovable: los anteriores dejan de funcionar. Revocar un permiso no invalida un respaldo que se haya guardado en ese equipo; renovarlo también si ese respaldo quedó expuesto.
- APIs privadas con `no-store`, `nosniff` y origen web restringido. Sin credenciales permanentes en query strings.
- Página de vinculación con `no-referrer`, CSP restringida y eliminación temprana del fragmento QR de la barra de navegación. No incluye analítica, publicidad ni QR externos.
- QR generado con biblioteca local `vendor/qrcode.js`, licencia MIT incluida. Fuente: https://github.com/davidshimjs/qrcodejs.
- Sin estadísticas ocultas, huella persistente del navegador ni transferencia automática de permisos de artista.
- Actualizaciones de biblioteca con revisión condicional. Cambios concurrentes incompatibles requieren decisión visible.

## Configuración y límites

Por defecto sólo se aceptan orígenes `https://uadavstream.com.ar` y `https://www.uadavstream.com.ar`. Para otra marca configurar `ACCOUNT_ALLOWED_ORIGINS` con la lista exacta separada por coma; actualizar URL API y `connect-src` de la página de vinculación. No habilitar todos los orígenes con `*`.

No se incorporó un servicio de pago. Workers y D1 mantienen sus límites/cuotas; no se garantiza costo cero a cualquier volumen. Las cuentas y bibliotecas no tienen cifrado de extremo a extremo. Una vulnerabilidad XSS en otro recurso del mismo origen puede acceder al almacenamiento del navegador; CSP de la página de vinculación no protege todo el sitio. Migrar todas las sesiones a cookies HttpOnly exigiría un API del mismo sitio y una revisión del shell/white-label; no está implementado.

Turnstile tiene un plan gratuito. Se recomienda como siguiente protección para altas y solicitudes masivas; no está activado ni conectado en este build. Requiere widget propio, site key pública y secret key en Cloudflare, validación server-side y verificación de hostname/action. No poner la secret key en GitHub. Docs: https://developers.cloudflare.com/turnstile/plans/ y https://developers.cloudflare.com/turnstile/get-started/server-side-validation/.

## Validación

`tests/account-pairing.mjs` ejecuta el SQL exacto contra SQLite y modela `batch` como transacción. Cubre confirmación, concurrencia, vencimiento, cancelación, repetición, separación entre cuentas, revocación, respaldo renovado, orígenes e intentos. `tests/account-sync.mjs` cubre mezcla, conflictos y ediciones durante solicitudes. `tests/account-device-flow.mjs` ejecuta dos clientes independientes contra el Worker y SQLite, con vinculación, sincronización, revocación y renovación del respaldo. `tests/account-qr.mjs` contrasta la matriz QR con un codificador Python independiente y verifica el margen de escaneo. Las pruebas no sustituyen la comprobación con cámaras y dos dispositivos reales después del despliegue del Worker.
