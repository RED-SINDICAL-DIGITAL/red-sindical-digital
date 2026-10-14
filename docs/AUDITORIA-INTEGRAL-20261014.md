# UADAV STREAM: auditoria integral y continuidad

Fecha: 14 de octubre de 2026. Repositorio: RED-SINDICAL-DIGITAL/red-sindical-digital.
No se modificaron main, produccion, recursos Cloudflare ni datos reales en esta etapa.

## Evidencias y limites

- Main inspeccionado: d5cba094d8752d90fd4d7307594520601e055dd7; frontend 12058; Worker fuente V11.7 / 11753.
- Auditoria inicial: fe129ae6bddba86a56059d9013589461ba021630, 59 commits por delante de main y ninguno por detras. Diferencias: Worker, Admin, Bolsa, formulario de senales, contratos, workflows y documentos.
- Desde la anterior entrega de Work d50e0b51 hasta main hay 13 commits: continuidad de herramientas de artista, actualizaciones, entrada index y manual comercial. No asumir que todos los cambios de Work quedaron solo locales: los archivos principales ya estan en main.
- Produccion: SIN VERIFICAR. La inspeccion del dominio por navegador fue bloqueada anteriormente; no se intento eludir esa restriccion. No hay evidencia actual de /api/health publicado, cache, Pages ni version del Worker desplegado.
- La existencia de una pagina, un endpoint o un indicador de salud no demuestra funcionamiento completo.
- Se inspeccionaron las entradas principales en main, el Worker completo de main y auditoria, diferencias de ramas, PR y resultados Actions. No es todavia una auditoria exhaustiva de cada linea de todos los archivos ni una prueba visual multidispositivo.

## Inventario funcional

Todos los estados siguientes describen evidencia de codigo/pruebas, no certificacion de produccion.

| Modulo | Main | Desarrollo / diferencia | Clasificacion actual y cierre requerido |
| --- | --- | --- | --- |
| Inicio, shell y navegacion | index redirige a app; shell, historial y enlaces | PR5 fusionado para version/cache | Sin verificar: vuelta atras, entradas, enlaces y carga doble con navegador |
| Hero, carruseles, destacados | Interfaces existentes | Contrato de producto en auditoria | Sin verificar: origen real del contenido, vencimiento y fotos |
| Responsive PC/movil/tablet/TV | CSS y vistas existentes | Sin certificacion visual nueva | Sin verificar: capturas, touch, teclado y control remoto |
| PWA / actualizacion | Frontend 12058; PR5 fusionado | Pruebas de aviso previas | Parcialmente operativo: falta cache fria/caliente y despliegue real |
| Busqueda independiente | buscar.html; endpoints YouTube/fallback | Sin cambio integrado nuevo | Sin verificar: consultas reales, paginacion, latencia y cuotas |
| Descubrimiento y artistas | artistas.html y perfil publico | Catalogo YouTube paginado en Worker | Sin verificar: persistencia del artista descubierto, categorias y fuente |
| Cuenta, dispositivos y artista privado | Mi perfil; sesiones temporales renovables; herramientas vinculadas | PR7 corrige rutas y errores; PR6 anterior sigue abierto | Defectuoso en main: helper de reintento produce barra inicial; probar autorizado/revocado y cambio de cuenta |
| Creacion, reclamo y propiedad | Flujos y verificacion separados del pago | PR7 no fusionado | Sin verificar: reclamo hasta acceso, rechazo, recuperacion y borrado |
| Contenido y visibilidad del artista | Perfil editable, canal opcional, videos/playlists | Sin cambio de onboarding de senales | Sin verificar: guardar, moderacion y visibilidad free/PRO |
| PRO, Press Kit y portafolio | Mi espacio, presentacion publica, presupuestos y agenda | Renovacion en herramientas ya en main | Parcialmente operativo: pruebas anteriores aisladas; falta pago/acreditacion hasta uso real |
| Estadisticas | Eventos y tablas en Worker | Sin nueva integracion confirmada | Sin verificar: exactitud, acceso del artista y privacidad |
| Contrataciones / marketplace | Formulario, consultas y estados | Sin comision; flujo publico | Sin verificar: envio, recepcion privada, respuesta y duplicados |
| Radio y reproductor global | radio.html y shell con reproductor | PR8 limita espera de metadatos | Sin verificar: un solo audio, persistencia, historial, programacion y errores |
| Pedidos y mensajes de radio | Endpoints y chat existentes | Documento de arquitectura separado | Parcialmente operativo: panel de operador y respuestas desde app pendientes de E2E |
| Inscripcion radio/TV | No existe el formulario nuevo en main | Auditoria agrega formulario configurable y solicitudes D1 | Parcialmente operativo: contratos; concurrencia, migracion y Cloudflare pendientes |
| Radio Studio / TV Studio | No se encontro endpoint dedicado con ese nombre en Worker inspeccionado | Requisito de permisos limitados | Pendiente: inventariar interfaces y completar permisos; no dar Admin central |
| TV/IPTV y En vivo | en-vivo.html; catalogo senales; importacion M3U y clasificacion HLS | Publicacion de senales en auditoria | Sin verificar: reproduccion HLS, fuentes autorizadas y PC/TV |
| Cartelera publica | cartelera.html, publicar-evento.html y endpoints | Documentacion comercial y contrato de producto | Sin verificar: publicar gratis, ficha, fechas, entradas externas y moderacion |
| Destacados y calendario | Productos, creditos PRO y vigencia en codigo | Sin certificacion de acreditacion | Parcialmente operativo: simulacion pago hasta publicacion y vencimiento |
| Bolsa / postularse | Publica y gratuita; formulario y gestion | Auditoria incorpora clave privada de seguimiento | Parcialmente operativo: 4 contratos pasan; probar recepcion, cambios de estado y secreto |
| Fuentes externas / importacion | Fuentes controladas, CSV y gestion | Sin cambios nuevos de auditoria | Sin verificar: permisos de fuente, borrar, duplicados y caducidad |
| Musica / playlists / biblioteca | Player y biblioteca integrados por PR4 | PR8 no fusionado | Parcialmente operativo: saltos, cola visible, temas restringidos y carga siguiente pagina |
| Podcasts / Shorts / cine | Rutas y catalogos multimedia | Solo fuentes autorizadas | Sin verificar: navegacion, fuentes, formatos y derechos; no garantizar albumes completos |
| Admin central | Gestion extensa, roles/modulos, exportacion y auditoria | Nuevas inscripciones/recuperacion en rama audit | Parcialmente operativo: falta recorrer cada circuito y controles visuales |
| Cobros / promociones / publicidad | Productos y pedidos; manual PR10 fusionado | PR11 selector territorial no conectado | Pendiente integracion comercial: campanas reales, segmentacion, cobros y permisos independientes |
| Moderacion IA | Gemini/Groq, cola y revision | No IA de generacion de Press Kit | Sin verificar: claves, cuotas, rechazos, recuperacion y permisos |
| Campana / Web Push | Backend y clientes existentes | Documento de mensajeria en auditoria | Sin verificar: suscripcion, entrega, revocacion y permisos del dispositivo |
| Seguridad KV generico | Fallback permite leer claves privadas sin auth | Bloqueo propuesto en esta auditoria | Defectuoso: reproducido con datos sinteticos; aun no corregido en produccion/main |
| Ticket / STREAM+ | Ticket deshabilitado por defecto en modules; STREAM+ fuera de oferta | No activar ni reintroducir | Mantener deshabilitado; verificar flags reales y limpiar textos heredados con evidencia |
| Manuales | Manual publico y producto/pagos en main | Varios documentos de auditoria separados | Parcialmente operativo: consolidar manual de artista, operador y Admin sin confundir roadmap con disponible |

## PR y ramas

| PR | Estado observado | Alcance / accion |
| --- | --- | --- |
| 1 | Abierto, conflictos | Interfaz V2 antigua: no fusionar sin comparar dependencias |
| 2 | Fusionado | V10.11: limpieza de lanzamiento, reproduccion y PWA |
| 3 | Fusionado | V11.7: integracion de 196 commits y Centro de Control |
| 4 | Fusionado | Player con favoritos, mas tarde y biblioteca |
| 5 | Fusionado | Aviso de actualizacion y version 12058; falta evidencia publicada |
| 6 | Borrador abierto, conflictos | Sesion previa; PR7 lo reemplaza conceptualmente, pero no fue cerrado |
| 7 | Borrador abierto, conflictos | Sesion, rutas API, contenido y parseo; 5 commits adelante / 1 detras de main |
| 8 | Borrador abierto, conflictos | Reproduccion/metadatos; 3 adelante / 1 detras; revisar AbortSignal.timeout en TV |
| 9 | Borrador abierto, conflictos | Inventario legacy, solo documento; 1 adelante / 1 detras |
| 10 | Fusionado | Solo manuales de publicidad, pagos y acceso publico; NO implementa conciliacion |
| 11 | Borrador abierto | 12 commits adelante; selector territorial y componente sin conexion a catalogo/Admin/pagos |
| 12 | Borrador abierto | 59 commits iniciales; titulo/cuerpo quedaron desactualizados respecto de su alcance real |

No se fusiono, cerro ni cambio ninguno de estos PR. V11 aparece en la evolucion hacia V11.7; no se certifica una release V11 independiente sin identificar su commit exacto.

## Riesgos por prioridad

1. P0: lectura generica de KV elude la proteccion de rutas privadas. Reproduccion local contra Worker real con datos sinteticos: /api/signal_onboarding_applications y /api/ticket_orders devolvian 200 y el registro ficticio. Main contiene el mismo fallback. Se agrega guardia para familias/claves privadas conocidas y prueba de 21 claves, incluido acceso administrativo compatible. El inventario completo de claves dinamicas y una politica publica explicita siguen pendientes.
2. P1: revision de senales usa lectura seguida de escritura sin condicion; puede revertir publishing. Se cambia a comparacion atomica del snapshot completo en D1. Conflicto devuelve 409; legacy KV conserva datos y requiere migracion explicita. No se migro ni borro ningun dato.
3. P1: sesiones de artista en main generan rutas de reintento con barra inicial y apiFetch concatena bases; PR7 ya propone la correccion. Integrar solo tras rebase y pruebas completas. La revocacion nunca debe renovarse como si fuera expiracion.
4. P1: publicacion usa lease D1 de 120 segundos pero escritura de catalogo KV no es transaccional. Falta resolver caducidad, escrituras por otros endpoints y recuperacion previa a adquisicion del lock.
5. P1: solicitudes historicas solo KV no tienen claim D1. Preparar migracion idempotente, validacion, reporte y rollback; no migrar automaticamente datos ambiguos.
6. P1: pago informado no equivale a acreditado. La activacion en 24 horas requiere verificacion real; no hay evidencia de banco/webhook conciliando automaticamente.
7. P2: selector territorial PR11 no esta conectado al frontend, Admin ni cobros. No vender una segmentacion como operativa hasta probar entrega Santa Fe/Cordoba/nacional/internacional.
8. P2: wildcard CORS en API general no sustituye autenticacion. Cuenta tiene control de origen separado; revisar todos los endpoints con datos personales, tasas, tamaños, duplicados y permisos.
9. P2: Radio Studio y TV Studio requieren credenciales limitadas y vinculo con operador. Ausencia de coincidencia nominal no prueba ausencia total; completar inventario de rutas y UI.
10. P2: recursos externos, contenido restringido a embeds, cuotas y compatibilidad TV necesitan reproduccion real, no solo sintaxis.

## Pruebas y resultados de esta etapa

- Actions inicial, commit fe129ae: Signal onboarding run 38552381838 FALLA (20/21); Job status run 38552381849 PASA. Se inspecciono el job: sintaxis pasa, contrato falla por regex vieja del bloqueo published/publishing.
- Publicidad PR11: Actions 38236159409 PASA. Es prueba unitaria, no entrega real de campanas.
- Tras correcciones locales: node --test tests/signal-onboarding-contract.test.cjs tests/job-status-contract.test.cjs: 25/25 PASAN.
- tests/signal-review-integration.mjs: Worker real + SQL SQLite ejecutados. Autorizacion, aprobar sin publicar, carrera contra publicacion y cambio de nota, legacy sin sobrescritura: PASA.
- tests/private-kv-fallback.mjs: Worker real, KV ficticio, 21 claves privadas denegadas, Admin permitido y footer publico conservado: PASA.
- node --check worker.js y smoke staging: PASAN.
- Smoke rechaza expresamente URL de produccion ANTES de hacer red: PASA como prueba negativa.
- Estas pruebas NO son Cloudflare D1 remoto, KV real, reproduccion ni E2E visual. Tampoco certifican toda la suite historica.

## Plan de ejecucion

| Prioridad | Trabajo | Ejecutable directamente | Condicion de cierre |
| --- | --- | --- | --- |
| P0 | Inventariar todas las claves KV privadas y publicas, reforzar guardias | Codigo/tests en rama audit | Ninguna ruta alternativa expone PII; compatibilidad publica comprobada |
| P1 | Revision atomica D1 | Hecho localmente y preparado para rama audit | SQLite pasa; falta D1 remoto |
| P1 | Sesiones y contenido artista PR7 | Rebase preparado en rama separada; no merge | Expiracion, revocacion, cambio de cuenta, consulta, guardar y recarga reales |
| P1 | Migracion legacy y publicacion concurrente | Codigo, fixtures y tests aislados | Sin perdida/duplicado, rollback y lease comprobados |
| P1 | Staging Cloudflare separado | Configuracion y smoke preparados | Recursos y URLs staging nuevos; permisos Cloudflare necesarios |
| P1 | Cuenta -> artista -> PRO -> herramientas -> destacado | Fixtures/simulacion sin pagos reales | Producto correcto, ownership independiente y vencimiento |
| P2 | Radio/TV/pedidos/Studio | Auditoria, permisos y fixtures | Una reproduccion; operador no puede entrar al Admin |
| P2 | Bolsa/Cartelera/contratacion publicas | Fixtures y pruebas sin PII | Envio, recepcion, seguimiento, fechas, errores y recuperacion |
| P2 | Publicidad territorial | Integracion en rama de desarrollo | No entrega Santa Fe a Cordoba; vigencia, pago y ubicaciones correctas |
| P2 | Visual y responsive integral | Inspeccion local/preview cuando disponible | PC, movil, tablet y TV; registrar navegador/modelo y capturas |
| P3 | Limpiar legacy y consolidar manuales | Analisis sin borrar | Dependencias y enlaces externos antiguos verificadas |

## Staging preparado, NO creado ni desplegado

Archivos: wrangler.staging.toml.example y tests/staging-readonly-smoke.mjs.
Bindings esperados: UADAV_DB (KV) y DB (D1). IDs marcadores intencionalmente invalidos.
Sin routes, dominios productivos, cron, queue ni secretos de integraciones reales.
No hay conector Cloudflare disponible en esta sesion. Requiere acceso autorizado a la cuenta para crear uadav-api-staging, uadav-staging-db y KV independiente. No copiar usuarios, claves o datos reales.

Pasos humanos concretos: crear los tres recursos nuevos, registrar sus IDs de staging, asignar los bindings, configurar ADMIN_KEY exclusivo y entregar URL de pruebas. Mantener formulario cerrado. El frontend staging debe auditarse para eliminar llamadas hardcoded a produccion antes de publicarse; no basta cambiar una variable.

Smoke remoto, una vez creado staging:

```sh
UADAV_STAGING_API=https://uadav-api-staging.SU_SUBDOMINIO.workers.dev/api/ node tests/staging-readonly-smoke.mjs
```

El smoke solo hace GET, rechaza produccion y redirecciones, verifica health y formularios cerrados. Despues siguen las pruebas de escritura con datos sinteticos, concurrencia, D1/KV, recuperacion y reproduccion autorizada descritas en SIGNAL-ONBOARDING-STAGING-PLAN.md.

## Decisiones preservadas

Basico, Bolsa y contratacion gratuitos; cero comision. STREAM+ eliminado. Ticket deshabilitado. PRO opcional USD3.99 mensual / USD30 anual, pagadero ARS con oficial mostrado antes de confirmar; 7 dias de destacado por periodo mensual, anual 12 cupos mensuales no acumulables. No inventar tarifas ni habilitar cobros. Destacados evaluados ARS5000/10000/20000 por 7 dias, sujetos a configuracion aprobada. Publicidad identificada y segmentada; productos/ownership independientes. IA para moderacion, no generacion de Press Kit. Solo links/fuentes autorizadas, no alojamiento de medios.

Un QR vincula dispositivos; Turnstile protege envios y no reemplaza esa vinculacion. Sesiones cortas se renuevan mediante una cuenta autorizada; revocacion y borrado se respetan. Navegacion movil segun instruccion vigente: Explorar, En Vivo, Cartelera, Bolsa de Trabajo y Mi Perfil. Revisar Inicio sin cambiar unilateralmente el menu.

## Reversion y entrega

Cambios limitados a la rama de auditoria. Revertir los commits de esta etapa revierte codigo/tests sin eliminar datos; main y produccion no fueron alterados. El informe y los archivos de staging no autorizan un despliegue. No promover hasta evidencia D1/KV real, permisos y revision del resto de los circuitos.
