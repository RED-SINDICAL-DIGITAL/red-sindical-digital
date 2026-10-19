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
| `artista.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `artistas.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `beneficios.html` | Página informativa de implementación futura; convenios reales pendientes. |
| `biblioteca.html` | Corregida y probada en escritorio; confirmar limpieza visual y móvil. |
| `bolsa-trabajo.html` | Publicación/aprobación/postulación/consulta ficticias previas; dispositivos pendientes. |
| `buscar.html` | Controles de reproducción y favoritos separados; filtro de artista, guardado sin reproducción, segunda página y retorno desde artista comprobados en staging. YouTube reproducible sigue pendiente. |
| `cartelera.html` | Publicación ficticia/moderación/detalle/retorno probados antes; revisión visual por dispositivos pendiente. |
| `contratar-artista.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `descubrir.html` | Música: 24 tarjetas comprobadas en staging. Eventos: fixture y acción Ver evento comprobados. Errores, reintento y cursor repetido cubiertos localmente; dispositivos pendientes. |
| `documentacion.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `en-vivo.html` | Radio reproducible comprobada; TV autorizada reproducible pendiente. |
| `evento.html` | Detalle de evento ficticio y retorno probados; dispositivos pendientes. |
| `gestionar-artista.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `guia.html` | Inventariada; revisión funcional y visual específica pendiente. |
| `index-v117.html` | Inventariada; revisión funcional y visual específica pendiente. |
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
- 23 pruebas locales de identidad/edición/navegación pasan, y el escenario de menú de cuenta con artista correcto también pasa. Verificación visual del despliegue pendiente.
- Esto unifica la interfaz. No elimina todavía los endpoints históricos del Worker ni sustituye las verificaciones de titularidad. Su retirada compatible debe tratarse en una próxima entrega de backend, con revisión de consumidores.
