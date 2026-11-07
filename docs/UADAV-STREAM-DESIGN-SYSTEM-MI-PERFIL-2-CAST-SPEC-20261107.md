# UADAV STREAM DESIGN SYSTEM + MI PERFIL 2.0 SPEC
**Versión:** DS 2.0 / Perfil 2.0 / Cast 0.1 · **Fecha:** 7 de noviembre de 2026
**Estado:** definición maestra aprobada como dirección de diseño; implementación posterior en staging.
**Referencia visual:** tablero original de ocho áreas aportado por el usuario. La imagen inspira identidad y composición; no es una especificación pixel-perfect ni una autorización para copiar interfaces de terceros.

## 1. Principios del producto
- **Primero celular:** diseñar para 320–430 px antes que para escritorio. Acciones grandes, lectura clara y pocas opciones por pantalla.
- **Una sola plataforma:** explorar, buscar, artistas, en vivo, cartelera, trabajo, Mi Perfil y Admin comparten colores, tipografía, iconos y patrones. Las áreas administrativas mantienen densidad funcional distinta.
- **Identidad azul/celeste:** recuperar la referencia original, con negros azulados, luz cian y transparencias discretas. No usar verde tipo Spotify como marca principal.
- **Referencias funcionales, no copias:** navegación musical simple y editorial para biblioteca/perfil; carruseles visuales para contenido audiovisual.
- **Preservación:** no cambiar tokens de cuenta, datos de favoritos, revisiones, permisos, correo, IDs de eventos/ofertas ni reproductor persistente por motivos estéticos. Cualquier cambio es primero staging.
- **Costo:** sin hosting tradicional, sin infraestructura de streaming propia, uso de Cloudflare Pages/Workers y proveedores ya integrados.
- **Accesibilidad:** componente que no se entiende sin texto de ayuda permanente necesita rediseño.

## 2. Design tokens de referencia
Los valores son defaults iniciales; el Centro de Diseño del Admin conserva capacidad de personalizar colores y creatividades autorizadas. No introducir múltiples valores hardcodeados en cada HTML.

| Token CSS | Valor inicial | Uso |
|---|---|---|
| `--u-bg` | `#050A13` | fondo principal |
| `--u-bg-raised` | `#0A1422` | paneles y encabezados |
| `--u-surface` | `#101D2E` | tarjetas |
| `--u-surface-hover` | `#172B43` | interacción |
| `--u-cyan` | `#12BCF5` | llamada principal, activo |
| `--u-blue` | `#176FF2` | acento secundario |
| `--u-text` | `#F3F8FF` | texto |
| `--u-muted` | `#A6BED4` | secundario legible |
| `--u-border` | `rgba(122,184,237,.18)` | separación sutil |
| `--u-glass` | `rgba(11,29,49,.76)` | overlay transparente |
| `--u-glass-strong` | `rgba(10,25,44,.92)` | panel sobre imágenes |
| `--u-success` | `#58D1A1` | estado exitoso |
| `--u-warning` | `#F4BB66` | aviso |
| `--u-danger` | `#F47C91` | error/peligro |
| `--u-radius-sm/md/lg` | `10/16/22px` | radios según elemento |
| `--u-focus` | `#9BE8FF` | contorno visible de foco |

### Uso de transparencias
- Superposiciones y menús: glass moderado, blur suave **solo donde sea útil**; contemplar degradación en móviles modestos.
- Imágenes: gradiente oscuro para contraste del título, no taparlas con paneles opacos.
- Evitar tres capas de bordes, sombras y glass sobre el mismo elemento.
- Reducir efectos cuando `prefers-reduced-motion` o cuando el dispositivo no tenga recursos suficientes.

### Tipografía
- Sistema/Inter existente, sin incorporar fuentes de terceros obligatorias.
- Nombre de perfil móvil: 28–34px / 850–900.
- Títulos de pantalla: 22–26px / 800–850.
- Títulos de sección: 19–22px / 780–850.
- Acción: 14–16px / 700–800.
- Texto secundario: 12–14px, contraste legible.
- Evitar bloques de explicaciones superiores a dos líneas en el inicio.

### Espaciado, tamaño y responsive
- Sistema: 4/8/12/16/24/32 px.
- Área de toque >=44×44 px; respetar `env(safe-area-inset-top/bottom)`.
- Móvil 320–430: vista de una columna, cuatro accesos en grilla 2×2 compacta o filas cuando hay poco ancho; carruseles horizontales.
- Tablet 768–1024: 2 columnas donde ayuden, navegación global sin duplicar.
- PC 1024+: ancho controlado, carriles amplios, panel secundario opcional.
- Smart TV: foco de control remoto visible, tarjetas grandes, navegación por flechas; acceso y gestión sensible desde móvil cuando TV no tenga método seguro.

## 3. Inventario de componentes compartidos
Todos deben tener estados loading, empty, error, selected/active, disabled y foco:
- **AppShell:** cabecera, búsqueda universal, player persistente, navegación inferior móvil de cinco destinos; TV con navegación específica.
- **ProfileHeader:** foto, alias, edición, sin campos técnicos expuestos.
- **ActionTile:** icono SVG local, nombre breve, descriptor de una línea.
- **ContentRail:** carátula 16:9 o 1:1 según tipo, desplazamiento, play interno, acción «Ver todo», sin porcentaje inventado.
- **EntityRow:** miniatura, título, estado y acción contextual para trabajos/eventos/publicaciones.
- **SegmentTabs:** pestañas accesibles, con una seleccionada, sin convertirlas en rutas nuevas si no hace falta.
- **StatusIndicator:** estados textuales verificables; no usar verde cuando solo está pendiente.
- **EmptyState:** una frase + una acción.
- **BottomSheet/Modal:** confirmación y gestión contextual, nunca forzar teclado innecesariamente.
- **FormField:** ayuda corta, error junto al campo, autocompletado y foco apropiados.
- **AccountSecuritySection:** correo, dispositivos, recuperación y operaciones sensibles; fuera del Home.
- **DevicePicker:** selector de dispositivo solo cuando exista compatibilidad real.

**Regla de implementación:** una hoja de tokens y componentes reutilizables (p.ej. `uadav-ui-tokens.css`, `uadav-ui-components.css`) y adaptadores discretos para módulos heredados. No añadir una tercera o cuarta capa de CSS específica para el mismo perfil. Cada módulo no debe reinventar botones y estilos.

## 4. Plataforma: ocho áreas de la referencia original
| Área | Patrón visual | Entrada móvil |
|---|---|---|
| Explorar | hero editorial + recomendaciones + continuar | un destacado y carruseles |
| Búsqueda | universal y contextual, resultados por tipo | icono en cabecera; pantalla de resultados |
| Perfil de artista público | cabecera imagen, biografía, galerías, videos, música, eventos | una columna con pestañas y controles |
| En vivo | TV, streaming, radio, player persistente | selector TV/Radio y player |
| Cartelera | portada, fechas, filtros, tarjetas de evento | filtros sencillos y publicaciones visibles |
| Bolsa | lista de oportunidades, estado, postular | filtros simples, CTA |
| Mi Perfil | centro personal de seis pantallas | Home compacto |
| Administrador / Centro de Diseño | gestión, identidad, banners, colores, roles, respaldos | móvil de gestión puntual; PC para tareas complejas |

No introducir una sexta opción en la barra móvil global. Navegación existente: **Explorar / En vivo / Cartelera / Trabajo / Mi Perfil**. Buscar desde cabecera.

## 5. Mi Perfil 2.0: mapa y copy final
### Inicio `/usuario.html`
```text
Avatar  Alias                 [Editar]
Mi espacio
[ Mi artista ] [ Mis trabajos ]
[ Mis eventos ] [ Mi biblioteca ]

Seguir viendo y escuchando      Ver todo
[portada] [portada] [portada]  (solo historial real)

Actividad reciente (si hay elementos)
Cuenta y seguridad     Ayuda
```
- No mostrar formularios de cuenta, claves, comprobantes ni bloques técnicos en Home.
- Actividad reciente: una sola sección compacta, sin duplicar avisos de Radio Studio y notificaciones.
- Alias corto, CTA claro, sin texto explicativo permanente.
- Si no hay historial, sección breve con «Explorar» o no mostrarla; nada ficticio.

### Mi artista · objetivo `/perfil-artista.html`
- Sin perfil: «Crear artista», «Vincular uno existente».
- Vinculado: foto, nombre, estado de autorización; «Editar artista», «Consultas», «Press Kit», «Ver perfil», «Herramientas» según permisos.
- Fuente de verdad: módulos y credenciales del artista existentes. No duplicar permisos.

### Mis trabajos · objetivo `/perfil-trabajos.html`
- Tabs: «Postulaciones», «Ofertas», «Comprobantes».
- CTA «Publicar oferta», acción secundaria «Buscar trabajos».
- Mantener lógica de `uadav-jobs-account.js`, consulta de comprobantes y estados de Admin.
- IDs `JOB` y `POST` distinguidos. Claves privadas nunca públicas.

### Mis eventos · objetivo `/perfil-eventos.html`
- Tabs: «Publicados», «Ocultos», «Destacados» (según estados reales).
- CTA «Publicar evento», acciones «Ver», «Editar», «Ocultar» o «Restaurar» autorizadas.
- Investigar antes endpoints/credenciales de propietario existentes; no construir listas falsas ni inventar borradores.
- Destacados pagos conservan aprobación, comprobante y vigencia.

### Mi biblioteca `/biblioteca.html`
- Tabs: «Favoritos», «Playlists», «Siguiendo», «Radios», «Historial».
- Identidad musical simple; para videos, carruseles visuales tipo streaming. Conservar sincronización y player persistente.
- No añadir un segundo panel «Favoritos» si ya existe Biblioteca.

### Cuenta y seguridad `/usuario.html?vista=cuenta` inicialmente
- «Mi correo», «Recuperar acceso», «Dispositivos», «Sincronización», «Datos de este equipo», «Eliminar cuenta» solo si implementado.
- Recuperación por código por correo y autorización existente; sin credenciales nuevas ni exposición de claves.
- Una única lógica de identidad. No duplicar módulos ni esquemas.

## 6. «Conectar a dispositivo» / proyección multimedia
### Objetivo
Permitir que el teléfono actúe como control remoto y el contenido compatible se vea/escuche en TV, Chromecast, Apple TV, parlantes o equipo compatible, **sin perder el reproductor actual**.

### Diferenciar conceptos
1. **Cast:** enviar URL reproducible de audio/video a un receptor compatible y controlar sesión desde el teléfono.
2. **AirPlay:** seleccionar salida compatible desde ecosistema Apple/navegador que la soporte.
3. **Duplicar pantalla:** reflejar pantalla completa del teléfono/PC; normalmente lo gestiona el sistema operativo. No equivale a Cast nativo.
4. **Abrir UADAV Stream en Smart TV:** aplicación/interfaz TV independiente, futuro control por dispositivo de forma segura; no asumir que Cast habilita toda la experiencia TV.

### Compatibilidad verificada con documentación pública
- Google Cast Web Sender soporta navegadores compatibles, pero **no Chrome en iOS** como remitente web. Requiere HTTPS y la integración Web Sender SDK; para medios sencillos se puede evaluar Default Media Receiver.
- Safari proporciona API específica `webkitShowPlaybackTargetPicker` para AirPlay en un elemento `video` soportado.
- `HTMLMediaElement.remote` / Remote Playback API tiene disponibilidad limitada en navegadores. Debe detectarse por capacidades y manejar cancelación.
- Un contenido incrustado de terceros (YouTube iframe, streams con DRM, Twitch) **no equivale** a un URL directo permitido para enviar a un receptor. No extraer streams, saltar condiciones de plataforma ni prometer transmisión indiscriminada.

Fuentes:
- Google Web Sender: https://developers.google.com/cast/docs/web_sender
- Google Receiver: https://developers.google.com/cast/docs/web_receiver
- Apple AirPlay web control: https://developer.apple.com/documentation/webkitjs/adding_an_airplay_button_to_your_safari_media_controls
- MDN Remote Playback: https://developer.mozilla.org/en-US/docs/Web/API/Remote_Playback_API

### UX
- Icono universal `pantalla + ondas` **en el reproductor persistente**, no en Mi Perfil ni en todas las tarjetas.
- Etiqueta: «Conectar a dispositivo». En sesión: «Reproduciendo en [dispositivo]»; opciones «Volver a este dispositivo» y «Desconectar».
- Abrir selector solamente tras toque del usuario; no escanear dispositivos sin consentimiento ni mostrar nombres antes de permiso.
- Si no hay contenido reproducible/capacidad disponible: ocultar botón o explicar brevemente «Este contenido no permite conexión desde la aplicación».
- No romper pausas, volumen, foco, reproducción local y persistencia; no duplicar la instancia del player.

### Plan de entrega
- **C0 — Auditoría del player (sin cambiar comportamiento):** clasificar emisoras HTML audio, video directo, HLS, iframes YouTube, Twitch, IPTV y podcasts; identificar URL autorizada y tipo de elemento.
- **C1 — Mínimo viable:** detectar Remote Playback / AirPlay en elementos nativos; botón condicionado por soporte; pruebas con TV real; sin backend ni costos adicionales en casos compatibles.
- **C2 — Google Cast Web Sender:** SDK cargado bajo demanda si aplica, receiver predeterminado para medios permitidos, pruebas Android/Chrome con Chromecast; revisar privacidad, HTTPS, metadatos y CORS del contenido. No asumir que todos los videos externos funcionarán.
- **C3 — Sesión TV integrada:** evaluar receiver personalizado/Smart TV y continuidad de sesión si la experiencia lo justifica. No implementarlo antes del MVP.
- **Nunca** crear un botón decorativo de Cast que no conecte realmente.

### Matriz de pruebas
| Caso | Resultado esperado |
|---|---|
| Android Chrome + Chromecast compatible + medio permitido | selector, reproducción, pausa y desconexión |
| iPhone Safari + AirPlay disponible | selector nativo y reproducción si el medio lo permite |
| iOS Chrome | no ofrecer Google Cast web falsamente |
| Video de tercero en iframe | no intentar usar URL incrustada como archivo reproducible |
| Sin dispositivos | interfaz limpia; sin errores ni solicitudes permanentes |
| Cambio de red o sesión interrumpida | retorno controlado al reproductor local cuando sea posible |
| Smart TV | navegación/foco funcional de la propia interfaz; no fingir compatibilidad universal |

## 7. Implementación segura en staging
1. **Fundación visual:** añadir tokens y componentes comunes de forma opt-in; comprobar que Admin pueda personalizarlos. Sin reescribir toda la app.
2. **Mi Perfil como piloto:** Home móvil con cuatro acciones, biblioteca/historial, subpantallas y seguridad; conservar IDs y adapters; no borrar DOM que aún requieran scripts hasta migrarlos.
3. **Artista/Trabajo/Eventos:** módulos propios con lógica compartida, sin inventar APIs; pruebas E2E en staging y datos QA.
4. **Resto de la plataforma:** explorar, búsqueda, en vivo, cartelera, bolsa, Admin con design system. Control de estilos duplicados y consistencia.
5. **Casting C0/C1** en paralelo solo tras auditar tipos de reproducción; C2 después de pruebas reales.
6. **Responsive:** móvil 320/360/393/430, tablet 768/1024, PC 1440, TV navegación por mando; accesibilidad y rendimiento.
7. **Puerta beta:** CI + QA real en dispositivos + Worker/D1/KV + recuperación/correo + respaldo y rollback. No promover a producción sin autorización expresa.

## 8. Criterios de aceptación y límites
- Primera visita a Mi Perfil: identificar artista, trabajos, eventos y biblioteca sin tutorial.
- No más de una ruta de recuperación de cuenta activa; no duplicar estado sincronizado.
- Fotografía y alias preservados entre sesiones; favoritos confirmados en dos dispositivos.
- Publicaciones de trabajo y evento conservadas, histórico y estados correctos.
- AppShell y player persistente sin regresiones.
- Icono de conexión a dispositivo solo en medios y dispositivos compatibles probados.
- Transparencias eficientes, texto legible, targets >=44px, barra inferior no tapa contenido.
- Mobile-first comprobado con capturas reales; CI por sí sola no certifica UX.
- No modificar producción, datos reales, claves ni cobros durante diseño.
- Este documento y su eventual hoja de tokens **no son el despliegue** de las nuevas pantallas ni de Cast.

## 9. Decisiones que quedan cerradas
- **Paleta oficial:** azul, celeste y oscuridad profunda de la referencia, con transparencias moderadas.
- **Cinco destinos globales:** Explorar, En vivo, Cartelera, Trabajo, Mi Perfil.
- **Mi Perfil:** seis áreas, Inicio sencillo y Cuenta y seguridad separado.
- **Netflix-like:** solo comportamiento editorial audiovisual y continuación real.
- **Spotify-like:** navegación personal/biblioteca, sin copiar su marca.
- **Casting:** se añade al backlog aprobado como capacidad condicional y progresiva, no como función ya instalada.
