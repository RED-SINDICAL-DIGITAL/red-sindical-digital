# Bolsa 11762 · captura y ensayo de respaldo · 25 de octubre de 2026

## Estado de esta entrega

Código preparado exclusivamente en `release/radio-studio-staging-rc-20261020`. Frontend separado en `audit/continuidad-demo-20261019`. Worker remoto observado por último en **11761**, D1/KV disponibles, correo y cola apagados. **11762 todavía requiere despliegue manual y QA remota.** No se modificó producción, cuyo head se comprobó en `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`.

## Causa reproducida y corrección

11761 solicitaba DNS con `redirect: "error"`. Node lo acepta, pero **workerd 2026-10-25 lo rechaza antes de consultar la red**: solo acepta `follow` o `manual`. El fallo se reprodujo dentro del motor usando el Worker 11761 exacto, con todos los destinos reemplazados por un servicio sintético local. La nueva prueba también rechaza el código anterior. Esto explica una causa concreta del mensaje remoto; no presume que no pueda aparecer después otra restricción de transporte en Cloudflare.

11762 usa **manual** y rechaza expresamente cualquier respuesta 3xx del resolvedor. Nunca sigue su `Location`. Conserva la comprobación A/AAAA, validación pública en cada salto del HTML, límites de bytes/tiempo y la ausencia de cookies o clave Admin en consultas externas. JSON inválido del resolvedor y error de transporte reciben mensajes distintos y seguros, sin direcciones internas, respuestas crudas o stacks.

La cancelación de un cuerpo es una limpieza sin espera bloqueante: un par que nunca confirma la cancelación ya no puede detener el rechazo por tamaño o timeout. Node cubre esa cancelación que nunca se resuelve; workerd cubre un flujo demorado y su cancelación.

Referencia primaria: [motor oficial de Cloudflare y configuración de servicios](https://github.com/cloudflare/workerd/blob/main/src/workerd/server/workerd.capnp). No se cambia ninguna compatibilidad, regla de red, binding o protección remota. La comprobación DNS sigue sin fijar la conexión HTTP a las IP validadas; la salida pública controlada permanece como requisito antes de producción.

## Comprobaciones

- **57 pruebas focalizadas Worker**: 35 anteriores de datos/cuentas/avisos y 22 grupos de fuentes, con 3 grupos nuevos sobre redirección DNS, errores seguros y cancelación no bloqueante.
- **9 comprobaciones en workerd**: UTF-8 y JSON-LD con fetch real del motor, redirecciones de origen, DNS privado, redirección del resolvedor, JSON inválido, tipo de archivo, bytes reales, flujo demorado y ruta Admin del Worker completo con autorización. Se usa `@cloudflare/workerd-linux-64@1.20261025.1`, instalación sin scripts. No hay red externa: todos los destinos se reemplazan por un servicio sintético del motor. No se confunde este ensayo con HTTP independiente desplegado en Cloudflare.
- **134 pruebas Pages/Admin**, más importación/exportación. Las planillas preservan la identidad por ruta/consulta, normalizan dominio/fragmento y rechazan etiquetas de dominio inválidas. Admin exige 11762 antes de capturar enlaces; CSV permanece disponible.
- Sintaxis, fuente embebida, política pública, compatibilidad KV y 12 controles estáticos de Radio aprobados localmente. Estas comprobaciones no acreditan todos los módulos de la plataforma.

El workflow de Bolsa ahora ejecuta la prueba real de workerd en cada cambio de código de su rama staging. La dependencia queda fuera del Worker y del ZIP: Cloudflare sigue recibiendo un archivo autónomo.

## Respaldo privado: ensayo real de su contenido

Se materializó la versión **3** del respaldo privado existente; 258655 bytes, SHA256 `f3fcfe8f2960be20de3341c36bdc16fa13990bd758cbae9bfeabb2375df904d2`, idéntico al último respaldo verificado. No se reemplazó o duplicó su identidad ni se subieron sus datos a GitHub.

El nuevo `scripts/rehearse-job-restore.mjs` ejecutó las rutas reales del Worker contra **SQLite en memoria**, con toda la red deshabilitada. Recuperó **11 ofertas, 10 postulaciones, 6 credenciales, 3 vínculos y 1 marca de aviso**, en cinco lotes de hasta cinco registros. El cotejo comparó todos los campos y las credenciales sin imprimirlos. Repitió todos los lotes sin duplicar. Una interrupción SQL provocada revirtió oferta, candidatura, credencial, vínculos y ledger del lote, y el reintento posterior funcionó. Integridad y referencias aprobaron. Ambos endpoints de recuperación por correo siguieron en 503.

**Límite del ensayo:** usa SQLite local y modela la transacción D1; no valida una base D1 remota. Se conservaron previamente los padres de cuenta del respaldo, como exige la restitución de faltantes de Bolsa. No recrea cuentas personales, anuncios o lecturas que se hayan perdido, ni prueba recuperación completa de toda la plataforma. No se activó `ENABLE_JOB_D1_RESTORE` en staging. El intento de preparar Miniflare local no produjo una comprobación D1 utilizable en este entorno y no se cuenta como prueba aprobada.

Para reproducir, con Node y Python disponibles:

```sh
node scripts/rehearse-job-restore.mjs /ruta/privada/respaldo.json
```

No copiar el JSON privado al repositorio. El script no acepta una URL de Worker o base, no usa credenciales Cloudflare y solo devuelve conteos/veredictos. El respaldo sigue siendo de 11760; ensayarlo no lo convierte en un respaldo nuevo de 11762.

## Una sola acción manual preparada

1. Descargar `releases/uadav-api-staging-11762.zip`, extraer `worker.js` o copiar el archivo completo desde GitHub.
2. Cloudflare → Workers & Pages → **uadav-api-staging** → Edit Code → reemplazar todo y Deploy. Conservar los bindings staging, `JOB_STORE_D1=true` y mantenimiento desactivado. **Sin SQL, variables, secretos, rutas o cron nuevos.**
3. Health: `https://uadav-api-staging.uadavstream.workers.dev/api/health` debe mostrar **11762**, D1/KV activos, correo y cola apagados. Avisar «hecho».

ZIP verificado: **153889 bytes**, el `worker.js` extraído coincide byte por byte con el código probado. SHA256 Worker: `94e6603f4f9d44f6cfaa6f152c4670f27335ef9fdd7c52e90c3985b4ecdaab98`.

Tras el despliegue, continuar en Admin staging con la fuente ficticia propia: revisión, incorporación, repetición sin duplicar y ocultamiento. Volver a cinco ofertas públicas y cotejar un respaldo posterior. El resto de los seis bloques sigue registrado en `BOLSA-ESTADO-Y-CIERRE-20261025.md`: correo transaccional, restauración remota desechable, aviso vencido/cron, cuentas y concurrencia independientes y dispositivos restantes.
