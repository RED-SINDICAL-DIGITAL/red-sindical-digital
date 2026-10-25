# Bolsa · ensayo D1 desechable · 11762-restore-qa-1

## Estado

El usuario proporcionó el enlace **https://uadav-restore-qa.uadavstream.workers.dev/** y el 25/10/2026 se observó la interfaz desplegada. Health informa versión `11762-restore-qa-1`, núcleo SHA256 `94e6603f4f9d44f6cfaa6f152c4670f27335ef9fdd7c52e90c3985b4ecdaab98`, `enabled:true` y `database_bound:true`. **La prueba D1 remota todavía no se ejecutó ni está aprobada**: el acceso devolvió «Configurá una clave exclusiva de QA de al menos 32 caracteres». El binding DB existe, pero aún no se comprobó su identidad ni que esté vacío. El Worker principal de staging permanece en 11762; este ensayo no cambia sus bindings ni habilita su restauración.

## Preparación manual en Cloudflare

### 1. Base nueva

En **D1 SQL database → Create Database**, crear:

`uadav-bolsa-restore-qa`

Dejarla vacía. No ejecutar SQL ni importar el respaldo privado. La herramienta prepara sus tablas solo después de comprobar que la base está vacía.

### 2. Worker independiente

En **Workers & Pages → Create application → Start with Hello World**, crear:

`uadav-restore-qa`

Descargar `releases/uadav-restore-qa-11762.zip`, extraer **worker-restauracion-qa.js** y pegar su contenido completo en Edit code de **ese Worker nuevo**. Deploy.

Este archivo rechaza los nombres de los Workers existentes de staging y producción. Abrir el enlace **Visit** del Worker desplegado; la vista previa del editor puede tener otro nombre y se rechaza deliberadamente.

### 3. Binding y clave, solo en el Worker nuevo

En **uadav-restore-qa → Bindings → Add binding → D1 database**:

| Campo | Valor |
|---|---|
| Variable name | `DB` |
| D1 database | `uadav-bolsa-restore-qa` |

En **uadav-restore-qa → Settings → Variables and Secrets → Add**:

| Tipo | Nombre | Valor |
|---|---|---|
| Text | `QA_RESTORE_ONLY` | `true` |
| Secret | `QA_RESTORE_KEY` | Clave nueva, exclusiva y aleatoria, de 32–256 caracteres ASCII, creada y guardada con tu gestor de contraseñas. |

Guardar y desplegar los cambios. No usar la clave del Admin ni compartir la nueva clave en el chat. Si hace falta que Work ingrese, se pedirá en el formulario seguro de autenticación.

El Worker nuevo solo requiere su D1 y esas dos variables. No agregar KV, bindings de servicios, correo, cola, cron, dominios o rutas de la plataforma. No ejecutar estas instrucciones sobre los recursos existentes `uadav-api-staging`, `uadav-staging-db` o producción.

### 4. Ejecución y resultado

Abrir Visit y entrar con la clave exclusiva. La pantalla debe indicar que la base está vacía. Marcar la confirmación de que se vinculó la base nueva y pulsar **Preparar base vacía**. Después, **Ejecutar pruebas**.

Hay seis pasos breves, uno por petición:

1. Restauración bloqueada por defecto: no escribe datos.
2. Recuperación de una oferta cerrada, una candidatura, su acceso, dos vínculos y una marca de aviso.
3. Repetición sin registros, vínculos o avisos duplicados.
4. Fallo SQL deliberado en otra pareja: rollback del lote completo.
5. Reintento que recupera la segunda pareja correctamente.
6. Cotejo de campos, credenciales, consentimiento, referencias e integridad SQLite/D1.

Esperado: **Ensayo completo**, con dos ofertas, dos postulaciones, dos credenciales, cuatro vínculos y dos marcas de aviso, todas ficticias. **Copiar resultado sin datos privados** devuelve solo conteos, veredictos y hash del código probado.

Si se corta la conexión, volver a **Abrir ensayo**: lee el paso confirmado y permite continuar. No cambiar de base, clave o bindings para forzar una ejecución. El ensayo no borra tablas, no vacía bases y no ofrece un reinicio destructivo. Los registros ficticios quedan en la base desechable.

## Controles y alcance técnico

- El punto de entrada público solo sirve la interfaz, health y tres operaciones propias protegidas. No publica las API de la plataforma ni sus exportaciones, recuperación, cuentas o moderación. Tampoco tiene `scheduled` o `queue`.
- Requiere nombre `uadav-restore-qa.<subdominio>.workers.dev`, modo QA explícito, clave dedicada y D1. Antes de una consulta a D1 comprueba la autorización.
- Rechaza una base con tablas ajenas. Repite la comprobación de base vacía dentro de la misma transacción que crea el esquema: una tabla concurrente provoca CHECK y revierte el DDL completo.
- La marca de la base se asocia a la clave del ensayo. Se comprueban IDs, contenido ficticio, cuentas, credenciales, vínculos y ledger antes de cada paso. No se admiten archivos, SQL, URLs o datos personales enviados por el operador.
- Reutiliza el **código completo exacto** del Worker principal como módulo privado. El adaptador llama directamente a su handler de restauración con un Request de hostname canónico y un entorno que contiene únicamente la **D1 desechable** y KV simulado en memoria. Es una llamada dentro del isolate: **no hace HTTP ni una llamada de servicio al Worker de staging**. El permiso de restauración se aplica solo a ese entorno interno de prueba; no modifica variables del Worker real.
- La interrupción añade un CHECK inválido a la llamada real `DB.batch`, a través de una envoltura de statements que conserva el binding D1 y sus sesiones `first-primary`.
- Se verifica idempotencia también después de perder la confirmación de un paso ya escrito. Una lease serializa operadores y se recupera tras una interrupción. No se cambia una clave existente ni se exponen credenciales en resultados, consola o portapapeles.

El núcleo incluido tiene SHA256 `94e6603f4f9d44f6cfaa6f152c4670f27335ef9fdd7c52e90c3985b4ecdaab98`. La fuente QA se genera con `node scripts/build-job-restore-qa.mjs` y CI comprueba que no haya quedado desactualizada.

Ocho grupos nuevos aprobaron localmente con SQLite real y las rutas del Worker. La suite focalizada suma **65 pruebas**. El motor workerd ejecuta **12 comprobaciones**: nueve del capturador y tres de compatibilidad/aislamiento del nuevo adaptador. Estas tres últimas no ejecutan D1 remoto. El respaldo privado real de 11762 también aprobó su ensayo local separado; **no se sube a este Worker**.

Referencias oficiales revisadas: [crear y vincular D1](https://developers.cloudflare.com/d1/get-started/), [secrets del Worker](https://developers.cloudflare.com/workers/configuration/secrets/), [PRAGMA admitidas](https://developers.cloudflare.com/d1/sql-api/sql-statements/) y [límites D1](https://developers.cloudflare.com/d1/platform/limits/). Cada fase usa peticiones separadas y consultas preparadas; no modifica los límites de la cuenta.

## Qué no cierra este ensayo por sí solo

Si pasa en remoto, acreditará el handler y las transacciones D1 con fixtures. No será recuperación integral de cuentas, mensajes o de toda la plataforma. No habilitará el endpoint de restauración del Worker principal, correo o cron. Para habilitar una recuperación real seguirá siendo necesario un alcance explícito y un respaldo vigente cotejado.

## Código guardado y CI confirmada

Commit del adaptador y del registro de captura: [`37e1cfb`](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/commit/37e1cfbd9c10c7a8800d4a38b0b4b3ada0623f64), únicamente en `release/radio-studio-staging-rc-20261020`.

- [Bolsa staging policy checks · 40238857214](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40238857214): **success**; fuente generada, políticas, 65 pruebas focalizadas, 12 comprobaciones workerd y compatibilidad KV aprobadas.
- [Radio Studio security checks · 40238857246](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40238857246): **success**.

Estos resultados prueban el código guardado. El despliegue independiente se observó después de esa CI; su estado actual figura al comienzo de esta guía. Las seis fases D1 remotas siguen pendientes. El Worker principal 11762, Pages, producción y la recuperación por correo no cambiaron.

## Bloqueo de configuración observado · 25/10/2026

El acceso se intentó una sola vez mediante browserAuth, sin revelar ni registrar la clave. El mensaje se origina en la validación de `env.QA_RESTORE_KEY`: esa variable falta o tiene menos de 32 o más de 256 caracteres. Esa comprobación precede a cualquier consulta D1, por lo que **esta sesión no consultó, preparó ni restauró la base**. No se rebajó el requisito de autenticación ni se modificó el código.

Intervención necesaria: únicamente en **uadav-restore-qa → Settings → Variables and Secrets**, crear o editar el Secret de nombre exacto `QA_RESTORE_KEY` con una clave exclusiva, aleatoria, de 32–256 caracteres ASCII. Guardar y desplegar el cambio. No compartir el valor en el chat ni tocar el Worker principal o las bases existentes. Después se retomará el acceso seguro y la comprobación de base vacía.

Evidencia del mensaje, con el campo de clave vacío: [captura de configuración](evidence/bolsa-restore-qa-clave-pendiente-20261025.jpg).
