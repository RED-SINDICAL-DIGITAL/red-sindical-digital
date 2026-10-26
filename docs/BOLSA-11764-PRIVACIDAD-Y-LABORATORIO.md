# Bolsa 11764 · corrección de privacidad y laboratorio D1 separado

Preparación del 26/10/2026. **Código y pruebas locales aprobados; despliegue 11764 y ensayo D1 remoto pendientes.** La última versión observada en el Worker operativo sigue siendo 11763. Bolsa todavía no está terminada.

## Corrección del Worker de staging

Al guardar una postulación con perfil artístico en Mi Perfil, la cuenta de la credencial artística debe coincidir con la cuenta autenticada que solicitó el guardado. Antes, una credencial artística válida de otra cuenta podía incorporarse a ese envío. La versión 11764 responde 403 sin crear la postulación, el vínculo ni el aviso cuando las cuentas difieren o la credencial artística anterior no identifica una cuenta.

Se probaron el rechazo de esos dos casos, el perfil propio y la postulación pública con comprobante privado. No se impone una cuenta a la publicación o postulación pública. La identidad se verifica en el servidor; el `account_id` enviado en el formulario no determina el titular.

Cambian únicamente BUILD y esa comprobación en `worker.js`. No cambian SQL, cron, vencimientos, credenciales existentes ni fechas de ofertas. Los endpoints de recuperación por correo siguen cerrados con 503. No se habilita restauración operativa.

### Entrega y despliegue exclusivo de staging

Archivo: `releases/uadav-api-staging-11764.zip`, con `worker.js` y `LEEME-STAGING.txt`.

1. Cloudflare → Workers & Pages → **uadav-api-staging** → Edit code.
2. Reemplazar el código completo por `worker.js` del ZIP y Deploy.
3. Conservar bindings y secretos. No ejecutar SQL. Mantener `JOB_STORE_D1=true`, mantenimiento apagado y `JOB_STAGING_CRON=bolsa-only`.
4. Conservar el único cron ya existente `*/15 * * * *`; no agregar otro ni volver a activar tareas compartidas.
5. Abrir `https://uadav-api-staging.uadavstream.workers.dev/api/health`: exigir build `11764`, D1/KV detectados y correo/cola apagados.
6. Admin staging → Auditoría → **Actualizar estado automático**: consulta GET del cron existente. No usar la revisión manual para simular el vencimiento.

El usuario autorizó expresamente usar Google para este ingreso. El 26/10 se continuó mediante formularios seguros: Google mostró la cuenta guardada UADAV STREAM, el usuario la seleccionó y Cloudflare volvió a `/login` con **Unable to sign in. Try again or use your email and password.** No se verificó una sesión administrativa. Se detuvieron los intentos al primer error del sitio, sin cambiar de método ni atribuirlo a bots. El anterior bloqueo de autorización del origen Google ya se superó; no volver a pedir ese mismo permiso como si faltara.

Health observado después del intento: `2026-10-26T20:25:45.306Z` (**17:25 de Argentina**), build **11763**, ok, D1/KV detectados y correo/cola apagados. No hubo despliegue 11764 ni cambios operativos desde Work. El próximo paso requiere el despliegue manual del ZIP anterior, siguiendo los seis pasos indicados. Registro sin credenciales ni URL OAuth en `evidence/bolsa-11764-acceso-cloudflare-20261026.json`. La guía de [limitaciones de acceso del navegador de Work](https://help.openai.com/articles/20001280-using-cloud-browser-in-chatgpt#when-a-website-blocks-the-task) explica esta alternativa; no se determinó la causa del rechazo específico de Cloudflare.

## Laboratorio nuevo: uadav-bolsa-lab

Archivo: `releases/uadav-bolsa-lab-11764.zip`, con su propio `worker.js` y `LEEME-LAB.txt`. **Este archivo corresponde a un Worker nuevo; no es el Worker de staging del apartado anterior.** No reemplaza `uadav-restore-qa` ni usa su base o clave.

| Recurso/configuración | Valor exclusivo del laboratorio |
|---|---|
| Worker nuevo | `uadav-bolsa-lab` |
| D1 nueva, vacía y desechable | `uadav-bolsa-lab` |
| Binding D1 | `DB` → esa base nueva |
| Variable Text | `QA_BOLSA_ONLY=true` |
| Secret creado por el operador | `QA_BOLSA_KEY`, clave exclusiva de 32–256 caracteres |
| Identidad de health | `11764-bolsa-lab-1`, `isolated-synthetic-bolsa` |

1. Crear la D1 nueva y el Worker nuevo con esos nombres, dentro de la cuenta de staging.
2. Pegar el código del ZIP del laboratorio, agregar únicamente el binding y las dos variables indicadas y desplegar los cambios.
3. No agregar KV, cron, correo, cola, dominios o rutas de producción. No cargar respaldos privados ni ejecutar SQL manualmente.
4. Abrir **Visit**, luego `/health`: `enabled` y `database_bound` deben ser `true`, con la identidad anterior.
5. Abrir la raíz e ingresar la clave exclusiva mediante su formulario. Nunca pasar la clave por chat, TXT, URL o captura. Para Work se utiliza ingreso seguro sobre ese formulario.
6. Confirmar que `DB` es la base nueva, distinta de las tres bases existentes, y pulsar **Preparar base ficticia**.
7. Autorizar las pruebas ficticias y pulsar **Ejecutar pruebas de Bolsa**. Deben aprobar ocho fases. Copiar únicamente **Copiar resultado seguro** para la auditoría.

Si aparece un error, no equivale a aprobación: conservar el código mostrado y el estado. No reusar otra base ni cambiar la clave de un laboratorio ya marcado. La herramienta rechaza bases no vacías, datos ajenos, otro secreto y los hostnames de los Workers existentes. Una pérdida de respuesta de una sonda puede requerir un nuevo ensayo en otra base nueva; nunca se deduce aprobación de un resultado incierto.

### Alcance de las ocho fases

| Fase | Comprobación exigida |
|---|---|
| 1 | Dos publicaciones simultáneas con el mismo identificador: una 200 y una 409, un registro y comprobante privado almacenado como hash. Catálogo sin campos privados. |
| 2 | Dos postulaciones simultáneas con consentimiento y perfil artístico propio: una 200 y una 409, un registro y aviso privado único para el contratante. |
| 3 | Listas e inbox aislados entre dos cuentas; rechazo de cierre y lectura ajenos; perfil artístico de otra cuenta rechazado; consentimiento ausente y datos adicionales no autorizados rechazados. |
| 4 | Dos cuentas intentan vincular el mismo comprobante anterior: un único vínculo y comprobante original todavía válido. |
| 5 | Otra solicitud revoca un dispositivo después de su autenticación y antes del lote: el guardado falla sin registros parciales. |
| 6 | Dos canjes del mismo token de recuperación interno: exactamente uno aprobado y una sola revisión nueva de credencial. |
| 7 | Fallo SQL inyectado: token, clave y vínculo revierten juntos; el reintento posterior aprueba. |
| 8 | Seis solicitudes con límite atómico de tres: tres aprobadas; integridad SQLite/FK y endpoints de correo todavía 503. |

Las sondas paralelas son solicitudes HTTP separadas desde la interfaz, coordinadas mediante D1. La aprobación local con el adaptador SQLite **no acredita** esas carreras en Cloudflare; falta desplegar y ejecutarlo allí. Las fases 6–7 prueban únicamente el helper interno de canje. No emiten tokens públicos ni acreditan envío, recepción, proveedor o recuperación por correo completa.

El código del núcleo se extrae del ZIP congelado de 11764 y se coteja por SHA256. No se exponen rutas de la plataforma ni el handler programado. El laboratorio instala los esquemas de cuentas/Bolsa y las definiciones mínimas originales que la plataforma usa para comprobar que D1 está preparada; así evita el bootstrap ajeno de toda la plataforma. Como cada sonda usa un proxy nuevo, se marca la caché del esquema de cuentas ya instalado antes de invocar el núcleo. No se sustituye la autenticación ni las transacciones de Bolsa. Cada solicitud dispone de un tope de 45 llamadas D1; un lote cuenta como una llamada, de acuerdo con el límite documentado por Cloudflare.

## Validación registrada

- **82 pruebas Node/SQLite de Bolsa aprobadas**, frente a 73 previas: un nuevo caso de aislamiento artístico y ocho grupos del laboratorio.
- **18 comprobaciones workerd aprobadas**, frente a 15 previas: incluye hostname, modo, autenticación antes de DB, interfaz e identidad del laboratorio. Estos controles no usan D1 remoto.
- **12 controles estáticos de Radio**, política pública, compatibilidad KV, fuente embebida, adaptador de restauración congelado, generación del laboratorio, sintaxis y diff aprobados.
- Ambos ZIP se abrieron, verificaron y cotejaron con sus respectivos JavaScript. No se repitieron las 138 pruebas UI por esta entrega de backend/laboratorio, sin cambios en Pages.
- Código y artefactos guardados en commit `7fd54d11be324e75e595a6452950111512ad2fb9`, exclusivamente en la rama Worker staging. CI [Bolsa 40383520286](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40383520286) y [Radio 40383520281](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40383520281), ambas `success` para ese commit. Pages `7e16b2a815a218df870d7375ae565af6893afa70` y main `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd` cotejadas sin cambios.
- La suite general de la plataforma conserva sus 46 fallos previos ajenos a este alcance. No se afirma que toda la plataforma esté aprobada.

| Archivo | SHA256 | Bytes |
|---|---|---:|
| Worker 11764 | `c98d9c5bcffec76beb68fb4075f8b967c019667923c425081d794191f0cff90f` | 639567 |
| ZIP staging 11764 | `23957b0243e7eed3edc9b9985b9ba274f69e432a718a299f2e46a6675b85bcb2` | 156698 |
| Laboratorio 11764 | `d4392464cf5b3c731fe49fe800ab1a3dedb37af1e1a584c11c98639382534013` | 680353 |
| ZIP laboratorio | `dbc8f0c9b46c712c2161cef3a3663158def1cc887fba9c30a9a68c7e6c0fb3ad` | 168066 |

## Qué sigue abierto

Conservar la oferta `JOB-MVPJ9WRW-439D4126D9AE` y candidatura `POST-MVPJCNGX-E7683EC0`. El aviso previo y el turno siguiente sin duplicado ya aprobaron. Desde el **27/10/2026 a las 00:00 de Argentina (03:00Z)** corresponde comprobar cierre, rechazo de nuevas postulaciones, candidatura preservada, aviso posterior y otro turno sin duplicados. No cambiar la fecha para adelantar esa prueba.

También siguen abiertos: recuperación transaccional por correo con proveedor/remitente verificados; restauración remota completa del respaldo privado y alcance cuentas/mensajes; fuente externa real autorizada y transporte que cierre el riesgo DNS/fetch; dispositivos físicos y accesibilidad. No hay proveedor ni fuente real seleccionados en el contexto recuperado. No elegirlos ni habilitarlos por suposición. El estado integral sigue en `BOLSA-ESTADO-Y-CIERRE-20261025.md`; Cartelera continúa después del cierre de Bolsa.

Referencias técnicas oficiales consultadas: [límites D1](https://developers.cloudflare.com/d1/platform/limits/) y [API D1Database y lotes](https://developers.cloudflare.com/d1/worker-api/d1-database/).
