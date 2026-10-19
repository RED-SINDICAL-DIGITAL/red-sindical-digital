# Revisión integral de secciones — 19 de octubre de 2026

Entorno autorizado: staging, rama audit/public-job-status-20261012. Producción y pagos no modificados. Este inventario incluye las 46 páginas HTML de raíz; no equivale a 46 circuitos validados de extremo a extremo.

## Evidencia de esta pasada

- Biblioteca: búsqueda en lista, estado tras reproducción y guardados verificados en navegador de escritorio en sesiones de esta auditoría. Quitada cabecera repetida dentro de la app y formulario de creación en lista abierta.
- Perfil: enlace Contratar artistas corregido a Artistas y seguido en navegador. Etiquetas accesibles de edición e intereses; 19 pruebas de protección de identidad/foto/artista pasan.
- Catálogo público de playlists: renderizado seguro con textContent, búsqueda, validación de respuesta, timeout y reintento. Sintaxis comprobada; prueba del catálogo en navegador pendiente.
- Sumate como artista / Sumá tu señal: bloqueo de doble envío, identificador obligatorio, datos conservados. Cuatro escenarios simulados pasan: envío confirmado y respuesta incompleta en ambos formularios. El alta de artista ya no reenvía automáticamente una escritura a otra API. No se enviaron nuevas solicitudes reales en esta pasada.
- 140 pruebas locales CJS pasan. Integraciones aisladas de RSS, Studio, Trabajo y módulos pasan. Estos resultados no sustituyen pruebas reales ni móviles.

## Inventario y siguiente verificación por página

| Página | Estado / próxima verificación |
|---|---|
| `admin.html` | Moderación/RSS/módulos probados antes y controles locales pasan; revisión visual completa y operadores pendientes. |
| `app.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `artista.html` | Canal exacto, 39 playlists con nombres/cantidades, compartir y seguir/abrir/volver desde Biblioteca comprobados en staging. Carátulas externas, discografía y dispositivos pendientes. |
| `artistas.html` | Búsqueda por enlace/@usuario y apertura del canal exacto comprobadas en staging; selección entre todas las coincidencias por nombre y categorías completas pendientes. |
| `beneficios.html` | Página informativa de implementación futura; convenios reales pendientes. |
| `biblioteca.html` | Artistas seguidos conserva canal y regreso con pestaña/búsqueda; prueba real completa desde Mi perfil en escritorio. Móvil y sincronización entre dispositivos reales pendientes. |
| `bolsa-trabajo.html` | Publicación/aprobación/postulación/consulta ficticias previas; dispositivos pendientes. |
| `buscar.html` | Controles de reproducción y favoritos separados; filtro de artista, guardado sin reproducción, segunda página y retorno desde artista comprobados en staging. YouTube reproducible sigue pendiente. |
| `cartelera.html` | Publicación ficticia/moderación/detalle/retorno probados antes; revisión visual por dispositivos pendiente. |
| `contratar-artista.html` | Verifica identidad exacta y disponibilidad; muestra nombre público, controla condiciones y reintentos sin duplicar. Falta completar envío real a un artista de prueba y dispositivos. |
| `descubrir.html` | Música: 24 tarjetas comprobadas en staging. Eventos: fixture y acción Ver evento comprobados. Errores, reintento y cursor repetido cubiertos localmente; dispositivos pendientes. |
| `documentacion.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `en-vivo.html` | Radio reproducible comprobada; TV autorizada reproducible pendiente. |
| `evento.html` | Detalle de evento ficticio y retorno probados; dispositivos pendientes. |
| `gestionar-artista.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `guia.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `index-v117.html` | Carga independiente, búsqueda general, favoritos sin reproducción, audio propio desde Continuar y regreso desde artista comprobados en staging. Revisión completa por dispositivos y pulido visual pendientes. |
| `index.html` | Entrada/redirección; verificar modos desde configuración sin cambiar producción. |
| `manual.html` | Actualizada con Biblioteca; verificar anclas. |
| `marketplace.html` | Página informativa de productos/servicios, catálogo aún no implementado; no confundir con contratación de artistas. |
| `media.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `mi-espacio-artista.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `mi-perfil.html` | Alias; verificar que conserve destino y estado. |
| `mi-uadavstream.html` | Alias; verificar destino. |
| `para-artistas.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `peliculas-series.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `planes-artistas.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `playlists.html` | Corregida; estado vacío y búsqueda sin coincidencias comprobados en navegador. Catálogo con contenidos y reintento tras fallo pendientes. |
| `podcasts.html` | RSS propio audio/video probado en staging; automatización cron y móvil físico pendientes. |
| `presskit.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `privacidad.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `promo.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `publicar-evento.html` | Circuito ficticio real y pruebas locales previas; dispositivos pendientes. |
| `radio-studio.html` | Permisos/aislamiento probados localmente; operador real pendiente de confirmación de cuenta y radio. |
| `radio.html` | Radio nativa propia y participación probadas previamente; móvil físico y mensajes reales pendientes. |
| `radios.html` | Alias conserva búsqueda/fragmento y redirige a Radio; verificar navegador. |
| `reclamar-artista.html` | Entrada antigua redirigida a Mi perfil → Mi artista. Sin botón de reclamo en el perfil público. |
| `shorts.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `soy-artista.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `stream-plus.html` | Página informa retiro de STREAM+; revisar accesos antiguos. |
| `suma-tu-senal.html` | Corregida; cierre de inscripciones real confirmado en navegador, aviso con codificación antigua corregido en código. Recibo/errores/doble envío simulados; solicitud real y revisión pendientes. |
| `sumate-artista.html` | Entrada antigua retirada como formulario independiente; redirige a Mi perfil → Mi artista. El nuevo recorrido usa el onboarding con cuenta y revisión. |
| `terminos.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `trabajo.html` | Acceso al circuito de Bolsa; verificar navegación y dispositivos. |
| `usuario.html` | Corregida; acceso a Artistas seguido en escritorio; edición con identidad cubierta localmente. Cuenta vinculada real pendiente. |
| `vincular-dispositivo.html` | Inventariada; revisión funcional y visual específica pendiente. |

## Límites y bloqueos pendientes

- No hay aceptación completa en móvil físico, tablet ni Smart TV.
- Reproducción YouTube en el navegador cloud sigue sin resolver; no atribuirle éxito por las pruebas de audio/video propios.
- Revisar CSP para embeds oficiales externos; no extraer audio ni usar fuentes no autorizadas.
- Cron RSS sigue opt-in y desactivado; sin ejecución real comprobada.
- Flujos de cuenta/artista real, TV autorizada y permisos de operadores no están cerrados.
- Revisión del backend de postulaciones de artista: reforzar validación y persistencia/idempotencia en próxima entrega de Worker. El bloqueo frontend no garantiza idempotencia entre dispositivos.
- Falta comprobar el resto del inventario; mantener esta tabla actualizada y no declarar la demo terminada mientras existan circuitos principales sin aceptación.

## Alcance de la comprobación HTTP

El intento de lectura masiva sin autenticación desde el entorno de comandos devolvió 403 en las 46 rutas. No es evidencia de 46 fallos del producto: las páginas probadas sí cargan en el navegador. Este intento no se cuenta como aceptación ni como comprobación funcional. Sin intentos de eludir el rechazo.

## Accesibilidad adicional

Se marcaron como decorativas las miniaturas acompañadas por títulos en Admin, Artista, Artistas, Buscar y Evento para evitar anuncios repetidos. Sintaxis comprobada y 48 pruebas relevantes posteriores pasan. Queda prueba con lector de pantalla real.

## Búsqueda y Explorar — ampliación

- Búsqueda real «Madonna»: 25 resultados iniciales; Cargar más devolvió 45 resultados (44 contenidos y un artista). Abrir artista y Volver conserva consulta y los 44 contenidos.
- Hay 24 botones de reproducción y 24 de favoritos separados en la primera página, sin botones anidados dentro de enlaces. Guardar el primer favorito no activó el reproductor. Se restauró el estado anterior del favorito tras comprobarlo.
- Filtro Artistas conserva perfil descubierto sin mensaje contradictorio de categoría vacía.
- Explorar muestra 24 propuestas musicales y, en Eventos, el evento ficticio ya autorizado de staging. No se crearon publicaciones nuevas.
- Respuestas malformadas, fallo primario con fallback vacío, cursor repetido, reintento exitoso, estructura de controles, artista descubierto y títulos codificados tienen regresiones nuevas. La suite combinada con carga progresiva y fallback móvil cubre 18 escenarios.
- La corrección de entidades en títulos pasó las pruebas locales y quedó comprobada tras el despliegue: «Madonna - Papa Don't Preach (Official Video) [HD]» aparece con apóstrofe legible.
- Pruebas nuevas incluidas en CI; algunos runs siguen en cola. No se afirma aprobación completa de CI antes de recibir sus resultados.

- Observación visual pendiente: varias miniaturas de videos muestran el recurso genérico de respaldo en este navegador. Revisar disponibilidad/carga de imágenes externas por dispositivo; no se atribuye todavía una causa ni se declara resuelta.

## Decisión vigente: un solo recorrido de artista

- Mi perfil → Mi artista es la entrada para crear o vincular un artista. Sos artista y la página informativa Para artistas apuntan al mismo espacio.
- Se eliminó el botón Gestionar este perfil del perfil público, incluso con modo=artista. La navegación pública de descubrimiento y contenido sigue separada de la solicitud de gestión.
- Los formularios históricos Sumate y Reclamar ahora son páginas de compatibilidad que redirigen al espacio personal; no se reenvían parámetros antiguos ni datos privados.
- Etiqueta Crear o vincular mi artista coherente en el HTML y en los dos controladores de cuenta. La edición de artistas ya vinculados conserva sus permisos y destinos.
- 23 pruebas locales de identidad/edición/navegación pasan, y el escenario de menú de cuenta con artista correcto también pasa. Comprobado en staging: Sos artista llega a Mi artista y desplaza a la sección; su enlace inicia el onboarding con cuenta; el perfil público con modo=artista no contiene control de reclamo; los dos enlaces antiguos llegan al mismo espacio. Sin crear cuentas ni solicitudes reales en esta comprobación.
- Esto unifica la interfaz. No elimina todavía los endpoints históricos del Worker ni sustituye las verificaciones de titularidad. Su retirada compatible debe tratarse en una próxima entrega de backend, con revisión de consumidores.

## Solicitud privada de artista: confirmación e identidad

- El formulario conserva una copia de la selección y de los datos al iniciar el envío. Impide envíos simultáneos y cambios de selección durante el proceso.
- Exige una respuesta confirmada: success, referencia, artista, estado pendiente, seguimiento en cuenta y tipo de acceso privado. En solicitudes de perfiles existentes, el artista devuelto debe coincidir con el elegido.
- Una respuesta incompleta conserva el formulario y no muestra éxito. El recibo confirmado muestra una referencia y distingue borrador privado de solicitud de gestión pendiente.
- Búsquedas inválidas no se presentan como cero coincidencias ni habilitan crear por error. Se eliminó el recorte silencioso de 30 coincidencias.
- Cambio de cuenta, cierre en otra pestaña y precarga de selección descartan respuestas antiguas y limpian datos de contacto y selección.
- 14 pruebas locales de onboarding pasan; ciclo real del Worker en SQLite aislado también pasa (alta privada, rechazo, aprobación, aislamiento y revocación). Sin cuentas ni solicitudes reales creadas en navegador para esta ampliación.

### Cierre de controles de esta ampliación

- CI detectó tres fallos del arnés de restauración de pestañas: extraía código hasta openClaimFlow, función retirada con el botón público. Se actualizó el límite a addUnique, conservando las cinco comprobaciones de navegación/seguimiento.
- Commit de corrección: 7271cb77a52011cc5715a79367a372de20cd8050. Sus pasos del job Platform integration checks terminaron con éxito, incluidos onboarding, navegación, ciclos de propiedad, catálogo, radio, RSS y módulos. No se ocultó ni desactivó una prueba.
- Las 177 pruebas CJS disponibles en el entorno local pasaron. El ciclo de propiedad del Worker con SQLite aislado pasó.
- Staging carga uadav-artist-onboarding-v145.js?v=20261019-safety y muestra el acceso con cuenta. No se creó una cuenta ni se envió una solicitud real en este navegador. La aceptación completa con cuenta real y dispositivos continúa pendiente.

## Catálogo público del canal: continuidad y estados vacíos

- Videos y playlists descartan respuestas/errores tardíos cuando dejó de estar activo ese canal. Un cambio de canal durante el render tampoco inserta controles viejos.
- La paginación recuerda los cursores aceptados y detecta ciclos de varias páginas, conservando el catálogo y la página válida para reintentar.
- Cada canal conserva su pestaña; la selección se anuncia con aria-pressed. Las miniaturas tienen respaldo ante error.
- Colecciones sólo aparece cuando las playlists cargadas tienen candidatos identificables. Sigue siendo una agrupación por título, no una discografía verificada ni una solución de álbumes automáticos.
- Los catálogos vacíos confirmados muestran mensajes específicos para videos y playlists; un error sigue ofreciendo reintento.
- 19 pruebas locales de paginación y navegación del artista pasan. La aceptación visual y de carga contra staging se realiza después del despliegue; reproducción real de YouTube y dispositivos siguen pendientes.

### Aceptación real y metadatos incompletos

- Canal público comprobado: UCo4CrqhIV_tSOGdDWfVyCsg. Videos pasa de 64 a 114 contenidos con Ver más, manteniendo visible la pestaña.
- Playlists devuelve 12 registros. La respuesta directa de /api/youtube/channel_library confirma títulos vacíos, thumbnail no_thumbnail.jpg y count:0. La interfaz y el reproductor mostraban títulos genéricos. No se declara resuelto por aparecer tarjetas.
- Frontend: nombre alternativo si llega title/name, nombre de respaldo distinguible, contador desconocido sin fingir cero, aviso de metadatos incompletos. Cache de playlists de 10 segundos para no retener durante cinco minutos la información dañada.
- Worker 11754 preparado: cache nueva v2; normaliza metadatos ausentes como desconocidos y solicita una sola tanda oficial de hasta 50 IDs si faltan título, imagen o cantidad. Sólo mezcla IDs presentes en la página. Las respuestas parciales se conservan con metadata_incomplete y cache de 60 segundos, sin inventar títulos ni discografías.
- Documentación oficial consultada: https://developers.google.com/youtube/v3/docs/playlists/list (part=snippet,contentDetails y filtro id).
- 25 pruebas locales de biblioteca, navegación y recuperación de metadatos pasan. La recuperación real de metadatos permanece pendiente de despliegue manual del Worker 11754 en staging y de una nueva lectura de la API. La limitación puede persistir si el proveedor no devuelve los detalles; la interfaz debe decirlo.

- Frontend de metadatos comprobado en staging con el Worker anterior: mantiene las 12 listas, muestra «Playlist del canal 1…12», «Cantidad de videos no disponible» y el aviso de datos incompletos. Tabulación comprobada sin activar reproducción. No se afirma recuperación de títulos antes del nuevo Worker.
- Commit de código efa3e55a0a7c6881b0fc3f1a191b74d6fb675396: todos los checks de CI y Pages terminaron con éxito. 197 pruebas CJS locales pasan. Archivo completo worker-staging-11754.js preparado para despliegue manual, con SHA-256 documentado en WORKER-11754-PLAYLISTS.md.

## Radios favoritas — continuación 2026-10-19

- Radio ahora avisa localmente y al shell del cambio de favoritos después de una escritura confirmada. La sincronización real entre dispositivos sigue pendiente.
- Botón Favorita refleja aria-pressed y nombre de la emisora. Hay confirmación visible y un error legible si no se pudo guardar.
- El botón Radios favoritas y las aperturas desde Biblioteca conservan sólo un regreso local validado a tab=radios, con la búsqueda. Emisoras sin ID propio pueden resolverse por su stream guardado.
- Nuevos favoritos incluyen programa/ubicación; la búsqueda local de Biblioteca contempla esos campos.
- 218 pruebas CJS locales y todos los checks/Pages pasan. Aceptación real en staging: BEAT DIGITAL RADIO · PRUEBA → Favorita confirma guardado y aria-pressed=true → Radios favoritas → buscar BEAT → Abrir radio conserva RAD-MVB7AHVS-TP0Y → Radios favoritas restaura pestaña y filtro. Quitar/reagregar también confirma estado false/true. No se inició reproducción ni se enviaron mensajes o pedidos en esta pasada. No requiere otro Worker.

## Inicio y Explorar — continuación 2026-10-19

- Inicio inicia sus catálogos sin esperar landing_config/web_visibility/home_layout. La configuración se aplica cuando llega; se mantienen los controles de módulos de la plataforma.
- Buscar desde Inicio lleva a la búsqueda general; se retiró la segunda lista de resultados limitada de la portada.
- Reproducir y Guardar son botones nativos separados, con foco y controles de 44 px. El teclado de botones de hero utiliza el click vigente después de cambios editoriales.
- Historial local null/no-array/dañado se trata como lista vacía, conserva carátula y tipo; un fallo de almacenamiento no deriva en otra reproducción de respaldo.
- Inicio y artistas recientes de Explorar usan el canal exacto mediante profileHref. Los enlaces de radio admiten id, nombre o señal para registros sin ID.
- Favoritos en Inicio/Explorar avisan al shell después de guardar. No se certifica sincronización entre dispositivos.
- Propuestas distingue respuesta vacía confirmada de fuentes caídas y ofrece Reintentar.
- 231 pruebas CJS locales y todos los checks/Pages de ambos cambios pasan. Aceptación real: Inicio → Buscar @madonna abre búsqueda general y canal exacto; Guardar/Quitar en Continuar cambia aria-pressed sin reproducir (audio pausado y src vacío); Explorar carga 24 propuestas y ofrece perfiles exactos de Madonna y Topic.
- Artista abierto desde Inicio vuelve a Inicio; desde Explorar / En escena vuelve a kind=escena con esa categoría activa. Los destinos de retorno se validan contra rutas y parámetros permitidos.
- Audio propio QA de 12 segundos abierto desde Continuar: AUDIO nativo, paused=false, currentTime=10.9/12, sin error; carátula conservada. Cerrado al terminar la comprobación. Esto no certifica reproducción de YouTube ni equipos físicos.
- Títulos con entidades HTML corregidos y comprobados en la siguiente pasada. Las playlists sin metadatos del proveedor pueden conservar el título genérico Contenido en historial antiguo.

## Pulido de Inicio y Explorar

- Normalización de entidades en títulos de Inicio/Explorar mediante uadav-readable-text.js: una pasada, Unicode válido, sin insertar HTML; se mantiene escape del renderizado.
- Banner con controles anterior/siguiente/pausa cuando hay varias propuestas. Pausa con hover, foco dentro del hero, pestaña oculta y preferencia de movimiento reducido (incluido su cambio mientras la página está abierta). Limpieza de temporizador y listeners al reemplazar la configuración.
- Cada slide reinicia categoría, descripción e imagen cuando faltan, para no atribuir datos de la propuesta anterior.
- 236 pruebas CJS locales pasan. Controles de múltiples slides probados con fixtures aislados; staging usa hero genérico actualmente. Verificación publicada se registra luego.

## Aceptación de pulido y contratación

- Staging: La K\'onga y Show 90\'s aparecen sin entidades visibles en Inicio. Hero genérico comprobado con controles ocultos; rotación multi-slide comprobada mediante fixtures, no con cambios de configuración reales.
- Contratación verifica profile.id contra el artista solicitado, muestra su nombre en vez del ID técnico y bloquea enviar hasta artista confirmado + condiciones marcadas. Tras reset vuelve a bloquear enviar.
- Sin artista seleccionado: campo visible “Sin artista seleccionado”, datos personales deshabilitados, botón Enviar solicitud deshabilitado y explicación verificadas en navegador. No se envió una consulta real ni se aceptaron condiciones durante esta revisión.
- 249 pruebas locales pasan (incluye 10 de disponibilidad de contratación y 3 de reintentos) y todos los checks/Pages del commit 693b228c1fbcb0b049371edfed497a1de5f92b57 pasan. Sin nuevo Worker ni producción.

## Confirmación de consultas y gestión de estados

- POST público acotado a 15 segundos, sin reenvío automático a otra API. Una respuesta ambigua conserva el formulario y la clave del intento para reintentar sin crear otra consulta.
- Confirmación exige success=true, referencia de texto no vacía, artista exacto y estado pendiente. Sólo entonces se limpia el intento, se oculta el formulario y se muestra un comprobante con referencia copiable. Una nueva consulta se inicia expresamente.
- Claves de intento guardadas inválidas se regeneran; las válidas se conservan al reintentar y recargar.
- Consultas recibidas valida success + ID + estado devuelto por PATCH antes de mostrar Estado guardado; una respuesta incompleta conserva la selección anterior y permite Actualizar.
- 262 pruebas locales CJS + disponibilidad de contratación pasan. Integración del Worker completo con SQLite pasa: entrega, aislamiento entre artistas, avisos privados, estados, concurrencia, persistencia y reintentos idempotentes. Estas pruebas son aisladas; no certifican envío completo en staging ni entre equipos físicos.

- Publicación confirmada: todos los checks y Pages del commit 163e6e23f5c8ca24ea3b45a0e111e18a5b472640 pasan. En navegador, contratar sin artista mantiene el envío deshabilitado y el comprobante oculto (altura cero). El comprobante de éxito y la recuperación frente a respuestas erróneas se validaron con pruebas aisladas; el flujo completo real en staging continúa pendiente. Manual público actualizado.

## Mi perfil — datos, biblioteca y accesos

- Normaliza nombre/avatar/foto/intereses antes de pintar; mantiene campos adicionales de perfil y evita fallos con tipos inválidos. Historial filtra registros dañados o sin referencia reproducible.
- Resumen incluye radios favoritas y singular/plural correctos. Continuar ofrece Ver todo mi historial; títulos usan normalización legible y carátulas aceptan más campos del catálogo.
- Actualizaciones account-data/storage refrescan sólo si cambió la vista; un cambio de perfil invalida cargas de foto anteriores y una actualización de biblioteca no invalida una foto en edición.
- Retirado el acceso optimista por token legado: los accesos de artista siguen bajo comprobación de cuenta. Reproducción reciente admite shell alternativo o postMessage al origen local.
- 268 pruebas locales pasan. Verificación en navegador y publicación quedan registradas después del despliegue.

- Aceptación publicada: todos los checks y Pages de b356ac623d13c6d4d949b4e83cc1eaeea8a582a5 pasan. Dos pestañas reales del mismo navegador: reproducir audio QA en Podcasts incorpora el episodio al historial visible de Mi perfil sin recargar; guardar favorito actualiza 0→1 y quitarlo restaura 1→0. Ver todo mi historial abre Biblioteca tab=recent y muestra el episodio. Cerrado reproductor y favorito de prueba restaurado. No se verificaron dispositivos físicos distintos ni cuenta sincronizada.

## Cartelera y detalle — filtros y fechas

- Estado de filtros en URL y regreso local validado desde la ficha; Limpiar filtros restaura la agenda. Búsqueda ignora tildes y espacios exteriores.
- Fechas inválidas/rollover no generan NaN; varias funciones se evalúan para fecha/período. La tarjeta prioriza la próxima función. Esta semana respeta el cierre del domingo y Este mes excluye funciones pasadas.
- Filtros no sustituyen un fallo de carga con una agenda vacía. Catálogos con registros inválidos no confirman un vacío. Banner genérico sigue presente en HTML sin esperar APIs ni imágenes.
- Entradas sin dato explícito aparecen a confirmar; no se asumen de pago. Enlaces relacionados conservan el retorno a los filtros.
- 282 pruebas CJS + disponibilidad de contratación pasan; pruebas de slider/generic fallback pasan. Aceptación real en staging se registra luego.


### Aceptación en navegador — Cartelera y detalle
- Código verificado: `a4e17018783412f394ed2754dc16d3f5c9c24274`; cuatro controles remotos completados con éxito, incluido Cloudflare Pages.
- Demo staging: buscar DEMO muestra el evento ficticio EV-MVF91D41; abrir su ficha mantiene la identidad y «← Cartelera» conserva q=DEMO. Al regresar, el campo contiene DEMO y la agenda mantiene un resultado.
- Una búsqueda sin coincidencias muestra 0 eventos y una explicación; Limpiar filtros restaura la consulta vacía, Todos seleccionado y 1 evento.
- La ficha QA actualmente tiene fecha 2026-12-01. Fechas inválidas, múltiples funciones y límites de semana/mes se verificaron con pruebas automatizadas, no con modificaciones de registros públicos.
- Evidencia visual: uadav-cartelera-filters-20261019.jpg. Pendiente aceptación en móviles y Smart TV físicos.
