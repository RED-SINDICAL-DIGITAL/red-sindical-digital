# UADAV STREAM · Documento maestro de rediseño de Mi Perfil 2.0
**Versión:** 1.0 · **Fecha:** 2026-11-07 · **Alcance:** Pages staging primero · **Estado:** blueprint aprobado como dirección de trabajo, implementación pendiente

## 0. Decisión de producto
**Mi Perfil deja de ser una página larga con tarjetas y formularios, y pasa a ser un pequeño sistema de pantallas enfocadas.** La entrada es un tablero móvil simple; cada tarea tiene su vista. Las funciones de cuenta se centralizan en una sección protegida; los contenidos audiovisuales mantienen una fila tipo Netflix, mientras identidad, biblioteca y navegación toman el lenguaje de una app de música tipo Spotify, sin copiar marcas, recursos ni diseños exactos.

**Objetivo verificable:** una persona sin experiencia puede editar su identidad, entrar a su artista, encontrar sus postulaciones, sus eventos y favoritos, y recuperar una cuenta sin recibir instrucciones. Prioridad absoluta: móvil (320–430 px); luego tablet y PC; Smart TV con interfaz específica de lectura y reproducción, no formularios complejos.

**Reglas no negociables:** no perder publicaciones, favoritos, foto, playlists, cuentas, tokens, comprobantes, revisiones ni historial; no editar producción; no inventar datos ni funcionalidades. El correo es opcional excepto para recuperación/avisos consentidos; no exigir datos personales nuevos. Bolsa y Cartelera mantienen publicación pública automática; trabajos abiertos sin comisiones; anuncios geográficos y destacados sin cambiar reglas comerciales.

## 1. Arquitectura de navegación

```text
App (navegación global de cinco destinos)
Explorar | En vivo | Cartelera | Trabajo | Mi Perfil
                                         |
                                    Mi Perfil (Inicio)
                  +----------------------+----------------------+
                  |                      |                      |
              Mi artista            Mis trabajos           Mis eventos
                  |                      |                      |
          Crear / administrar      Postulaciones /        Publicados /
          Perfil / Press Kit       Ofertas / comprobantes  destacados
                  +----------------------+----------------------+
                                         |
                                   Mi biblioteca
                              Favoritos / playlists /
                             seguidos / radios / historial
                                         |
                                Cuenta y seguridad
                          Correo / acceso / dispositivos /
                          recuperación / datos locales
```

**Mapa de rutas recomendado (implementación por etapas; NO se asume que existan hoy):**

| Destino de usuario | Ruta canónica objetivo | Origen que se reutiliza |
|---|---|---|
| Inicio de Mi Perfil | `/usuario.html` | `usuario.html` |
| Mi artista | `/perfil-artista.html` | módulos de `usuario.html`, `/soy-artista.html`, `/gestionar-artista.html`, `/mi-espacio-artista.html` |
| Mis trabajos | `/perfil-trabajos.html` | `uadav-jobs-account.js` y formulario de comprobantes de `usuario.html` |
| Mis eventos | `/perfil-eventos.html` | lista y gestión de `/publicar-evento.html`, Cartelera/propietario vía API de staging; **no inventar endpoint** |
| Mi biblioteca | `/biblioteca.html` (ruta existente) | biblioteca, historial `uadav_recent_v11` y favoritos sincronizados |
| Cuenta y seguridad | `/usuario.html?vista=cuenta` (primera fase); evaluar `/perfil-cuenta.html` después | módulos actuales de cuenta/correo, mismos controles y autorizaciones |

**Criterio de separación:** los destinos con muchos flujos ameritan páginas propias; evitar seis copias de la misma aplicación y seis lógicas de login. Si una página independiente no tiene backend confirmado, mostrar acceso al flujo existente antes que crear un «centro» vacío o que simule resultados.

## 2. Diseño móvil: sistema visual

- **Superficie:** fondo negro suave `#080A0E`, superficies oscuras `#151A21`, contraste legible, acento UADAV frío/verde-menta `#9CDEBD` en acciones discretas; respetar tema global configurable del Admin. No convertir la plataforma entera en verde Spotify.
- **Tipografía:** fuente de sistema con Inter si está disponible; no descargar fuentes externas obligatorias. Títulos 22–28 px, nombre 26–34 px, acciones 15–17 px, textos de apoyo 12–14 px, contraste AA.
- **Iconos:** SVG locales uniformes, trazo consistente de 1.8–2 px, tamaño 20–24 px. Evitar emojis e iconos Unicode de diferentes familias, así como cargas externas para render crítico.
- **Ritmo:** separación de 8, 12, 16 y 24 px; esquinas 12–18 px; sin tarjetas gigantes repetidas. Controles táctiles mín. 44×44 px, áreas seguras `env(safe-area-inset-*)`.
- **Componentes reutilizables:** `ProfileHeader`, `ActionTile`, `SectionHeading`, `ContentRail`, `StatusPill`, `EmptyState`, `InlineAction`, `SegmentTabs`, `AccountSection`.
- **Navegación:** nunca añadir una sexta opción a la barra global inferior; respetar sus cinco destinos. Las subpantallas llevan «Atrás a Mi Perfil», título y acciones contextuales. No crear barras inferiores duplicadas.
- **Visualización:** máximo 1 CTA principal por pantalla. Mostrar estados reales de carga, vacío y error con una sola frase y una acción concreta. El contenido secundario se abre a demanda.
- **Accesibilidad:** tabulación, foco visible, títulos semánticos, `aria-label`, contraste, `prefers-reduced-motion`, tamaño de fuente del sistema, sin gestos obligatorios.

## 3. Pantalla A · Inicio de Mi Perfil

### Propósito
Acceso inmediato y reconocimiento personal. **No montar formularios de empleo, correo, código de recuperación o administrador en el inicio.**

### Disposición móvil propuesta
```text
[ FOTO  Nombre / alias                         ✎ ]
[ estado breve de cuenta, solo si requiere acción ]
                                                      
Mi espacio
[ 🎤 Mi artista ]       [ ▣ Mis trabajos ]
[ ▦ Mis eventos ]      [ ♡ Mi biblioteca ]

Seguir viendo y escuchando             Ver todo
[portada ▶] [portada ▶] [portada ▶ ...] (horizontal)

Actividad (SOLO si existen novedades)
[ 2 consultas nuevas ] [ 1 aviso de trabajo ]

[ Cuenta y seguridad ]   [ Ayuda ]
      barra global de 5 destinos fija
```

**Textos finales:**
- Header: nombre actual. Subtítulo opcional solo si agrega valor, predeterminado «Tu espacio».
- Sección: «Mi espacio».
- Acciones: «Mi artista», «Mis trabajos», «Mis eventos», «Mi biblioteca».
- Carrusel: «Seguir viendo y escuchando», acción «Ver todo».
- Avisos: «Novedades» y contador real, solo cuando existan.
- Secundarias: «Cuenta y seguridad», «Ayuda».

**Reglas:** no repetir «Favoritos» y «Biblioteca» como dos módulos principales; la biblioteca es un destino único. «Publicar evento» se ofrece dentro de «Mis eventos» y también en la Cartelera pública. «Publicar oferta» dentro de «Mis trabajos» y Trabajo público. Mi radio y avisos solo visibles si vinculados/pertinentes y en «Novedades», no como dos tarjetas permanentes. El avatar es identidad personal; no confundirlo con la fotografía del perfil artístico. El primer pantallazo debe mostrar cabecera y las cuatro acciones sin scroll horizontal. El carrusel se muestra con historial real; si está vacío, ocultarlo o mostrar una breve invitación, nunca carátulas ficticias.

## 4. Pantalla B · Mi artista

**Una sola pregunta:** «¿Qué querés hacer con tu perfil artístico?»

**Sin perfil administrado:** ilustración/ícono discreto, texto «Todavía no administrás un artista» y CTA **«Crear mi artista»**. Acción secundaria «Vincular uno existente». No exigir perfil artístico para postularse a ofertas.

**Con perfil administrado:** foto/nombre, indicador de permiso real, CTA **«Editar artista»**. Lista clara: «Ver perfil público», «Consultas», «Press Kit», «Herramientas». La interfaz no ofrece herramientas si el permiso no corresponde.

**Estados:** sin cuenta, perfil no vinculado, pendiente/reclamo, autorizado, acceso revocado, falla de red. En falla, no borrar ni reemplazar perfil por uno ficticio. Nunca mostrar token, código privado ni herramienta de reclamo en vistas públicas.

**Reutilización técnica:** mantener la autoridad de `/soy-artista.html`, `/gestionar-artista.html`, `/mi-espacio-artista.html` y sus permisos. La nueva pantalla es una puerta de entrada y agrupador; no duplicar endpoints.

## 5. Pantalla C · Mis trabajos

**Encabezado:** «Mis trabajos» con CTA «Publicar oferta»; opción «Buscar trabajos».

**Segmentos de igual jerarquía:** **Postulaciones | Ofertas | Comprobantes** (tabs con estado activo y navegación por teclado).

**Postulaciones:** filas de estado con título de oferta, fecha, estado legible («Recibida», «En revisión», etc.), «Ver estado». No exponer clave en la lista.

**Ofertas:** título, publicada/oculta/vencida, fecha, «Ver postulantes», «Editar» cuando corresponda. No mezclar `JOB-...` (oferta) con `POST-...` (postulación).

**Comprobantes:** acción «Importar comprobante», «Ingresar código» en sección desplegable; advertencia corta «Guardá tu clave: es privada». No mostrar una clave guardada como texto abierto ni sincronizarla involuntariamente.

**Vacío:** «Todavía no tenés postulaciones» + «Buscar trabajos». «Todavía no publicaste ofertas» + «Publicar oferta».

**Backend:** conservar `uadav-jobs-account.js` y backend actual. La nueva vista debe montar el mismo componente compartido con tabs configurables. Publicación automática y moderación posterior, sin comisión, sin exigir cuenta para publicar/postular.

## 6. Pantalla D · Mis eventos

**Encabezado:** «Mis eventos» + CTA **«Publicar evento»**.

**Segmentos:** **Publicados | Ocultos/Vencidos | Destacados** (mostrar solo estados que el backend entregue).

**Ficha mínima:** portada, nombre, fecha/lugar, estado y acciones permitidas «Ver», «Editar», «Ocultar/Restaurar». Destacar solo con circuito comercial existente de comprobante, aprobación y vigencia; no dar a entender que está activo antes de confirmación.

**Baja/restauración:** conservar historial; no convertir «Ocultar» en «Eliminar». Diferenciar evento de prueba y evento real. No inventar borradores ni reservas si no existen.

**Bloqueador técnico:** antes de construir una lista personal completa, identificar el endpoint/credencial de propietario ya existente en Worker de staging; si falta, primera entrega ofrece atajo a publicar y gestión actual, y abre una tarea de API separada. No almacenar códigos de propietario en páginas públicas.

## 7. Pantalla E · Mi biblioteca

**No crear otro catálogo en Mi Perfil.** Usar `/biblioteca.html` como pantalla principal, ajustando su entrada y navegación.

**Segmentos:** **Favoritos | Playlists | Siguiendo | Radios | Historial**. Mantener podcasts/otros contenidos como filtros de biblioteca cuando proceda.

**Lenguaje:** mosaicos para portadas (música, video), listas compactas para radios y favoritos de artistas, carrusel horizontal para continuidad audiovisual, acción de reproducir real.

**Comportamiento:** la misma cuenta sincronizada que el usuario ya recuperó por correo. Mostrar mensajes de sincronización solo si hay problema; nunca una lista vacía mientras carga sin indicación. No fabricar barras de progreso ni tiempos de reproducción. Reproductor persistente de shell; evitar abrir YouTube externo si la plataforma puede reproducir internamente según las restricciones actuales.

**Vacío:** «Todavía no guardaste favoritos» + «Explorar».

## 8. Pantalla F · Cuenta y seguridad

Vista propia **distinta** del inicio. En una primera etapa aprovechar `/usuario.html?vista=cuenta` ya implementado; después considerar un archivo independiente **solo si** se centraliza el montaje sin duplicación de lógica o credenciales.

```text
← Mi Perfil           Cuenta y seguridad
[ Correo ]            Verificado / verificar / recuperar
[ Dispositivos ]      Ver / vincular / revocar
[ Sincronización ]    Estado; resolver conflictos si existen
[ Datos en este equipo ] Borrar solo datos locales
[ Ayuda ]             Solucionar un problema
[ Zona delicada ]     Eliminar cuenta / cerrar acceso (con confirmación)
```

**Textos:**
- «Mi correo»
- «Recuperar acceso»
- «Mis dispositivos»
- «Sincronización»
- «Borrar datos de este equipo»
- «Eliminar cuenta» (solo si implementación real y permisos permiten; distinguir de borrado local).

**Seguridad:** códigos de un solo uso, comprobantes de propiedad y tokens nunca impresos en UI ni URL pública; acceso por correo verificado y consentimiento; manejar sesión expirada, cambio de identidad en medio de operación, duplicado de solicitud y error de red. Mantener `uadav-account-sync.js`, `uadav-account-email.js`, `uadav-profile-email.js` como fuente única. No mover operaciones destructivas al inicio.

## 9. Patrones de información y textos

| Antes / problema | Después |
|---|---|
| «¿Qué querés hacer?» + 8 tarjetas grandes | «Mi espacio» + 4 accesos compactos |
| «Mis trabajos y postulaciones» y «Mis ofertas publicadas» separados | «Mis trabajos» con tres pestañas |
| «Publicar evento» sin gestión visible | «Mis eventos» con publicar y administrar |
| «Favoritos» más otra tarjeta «Biblioteca» | «Mi biblioteca» como destino único |
| «Mi radio» permanente aunque no se use | Acceso contextual para operadores autorizados |
| «Mis avisos» como tarjeta grande | Contador discreto y sección «Novedades» solo si existe |
| Recovery/contacto en el home | «Cuenta y seguridad» |
| Mensajes de operación de varios párrafos | Una frase + acción |
| Demasiados `<details>` en el primer scroll | Pantallas independientes, tabs y listas |

## 10. Implementación por pasadas pequeñas (staging)

### Pasada 1 — Navegación y Home
- Mantener `usuario.html` como home; convertir sus accesos a cuatro destinos con nombres definitivos.
- Eliminar visualmente de Home formularios de gestión, duplicados y paneles técnicos. **No borrar nodos/IDs que usan scripts sin migrarlos primero.**
- Mostrar carrusel con datos reales y acceso seguro a biblioteca.
- Confirmar móvil 320, 360, 393 y 430 px y la barra inferior.
- Mantener `/usuario.html?vista=cuenta` y `#profileSettings`.

### Pasada 2 — Mi artista y Mis trabajos
- Extraer presentación a páginas específicas o subrutas pero **compartir lógica JS existente**, credenciales y eventos.
- Migrar según funcionalidades validadas; compatibilidad con enlaces anteriores.
- Verificar en staging permisos, postulación, comprobante, estado, publicación y ocultamiento.

### Pasada 3 — Mis eventos
- Auditar previamente APIs propietario/gestión de staging, sin inventar acceso.
- Crear vista según estados comprobados; preservar Cartelera pública y destacados.
- Verificar publicación real, ocultar, restaurar, mantener historial.

### Pasada 4 — Biblioteca y Cuenta
- Aprovechar `biblioteca.html`; simplificar pestañas y vacío.
- Finalizar cuenta y seguridad reutilizando módulos de correo y dispositivos.
- Verificar favoritas y playlists en dos dispositivos; recuperación/revocación en staging.

### Pasada 5 — Responsivo y beta
- Tablet: composición 2 columnas donde tenga sentido, sin duplicar rutas.
- PC: carriles y panel lateral opcional, no ensanchar formularios a todo el ancho.
- Smart TV: pantalla de acceso a biblioteca/continuidad con navegación por control remoto y foco grande. Cuenta/recuperación mediante QR o código solo si existe una solución segura implementada; de lo contrario derivar a móvil, no inventar autenticación TV.
- Evaluar tamaño de bundles, accesibilidad, rendimiento y errores de consola. CI y QA manual reales, con producción intacta.

## 11. Arquitectura técnica mínima para no seguir parchando HTML

- Crear una capa **`profile-components.css`** (tokens, header, tabs, list row, tile, estados) cargada por todas las vistas de perfil; evitar CSS duplicado inline con prioridades contradictorias.
- Crear **`profile-navigation.js`** para rutas, tabs, historial y deep links; sin copiar el estado de cuenta.
- Reutilizar módulos que ya funcionan (account, job account, artist access, library). Si no se pueden montar sin reescribir, introducir adaptadores pequeños y cubiertos por pruebas.
- Mantener acceso al API central de staging; no hardcodear producción en vistas previas Pages. Respetar configuración del Admin.
- Un solo `ProfileAccountStore` o API actual como fuente de verdad: **no** añadir otra base, otro cookie de identidad ni otro login.
- Conservar `localStorage` existente y formato de comprobantes; migraciones exclusivamente aditivas, reversibles y verificadas. No limpiar datos QA arbitrariamente.
- No desplegar Worker por cambios visuales. Requerir cambios Worker **solo si un endpoint real falta** para «Mis eventos» o permisos, y entonces preparar parche aparte para revisión.

## 12. Criterios de aceptación

| Caso | Aprobación |
|---|---|
| Primera visita móvil | reconocer «Mi artista», «Mis trabajos», «Mis eventos», «Mi biblioteca» sin instrucciones |
| Editar identidad | cambiar nombre/foto, persistir y no afectar el artista |
| Perfil artístico | crear, vincular, editar, consultar y denegar sin permiso |
| Bolsa | publicar/postular/consultar, estados reales en Admin; conservar ID JOB vs POST |
| Cartelera | publicar, ver, ocultar/restaurar en staging; destacados solo con aprobación |
| Biblioteca | favorito creado en teléfono visible en PC, y viceversa |
| Recuperación | correo verificado desde segundo dispositivo, sin compartir códigos |
| Carrusel | reproducciones reales; no fingir progreso y no perder player persistente |
| Cuenta | dispositivos, seguridad y borrado local separados del home |
| Responsive | 320/360/393/430 px, 768 px, 1440 px y navegación con teclado/TV |
| Rendimiento | imágenes lazy, sin carga innecesaria de seis módulos al abrir perfil |
| Seguridad | sin secretos en enlaces/HTML, producción intacta, rollback disponible |

## 13. Peligros identificados y cómo evitarlos
1. **«No veo el formulario»:** no borrar un script cuyo DOM espera un ID. Migrar el DOM + montaje del script juntos y probarlo.
2. **«Quedó vacío Mis eventos»:** no asumir un endpoint propietario; comprobarlo primero.
3. **«Perdí favoritos»:** no inventar un nuevo esquema de claves ni dejar de invocar sincronización.
4. **«Recuperación duplicada»:** reutilizar un solo mecanismo de identidad y permisos; QR/TV posterior.
5. **«Se ve lindo pero no funciona»:** pruebas CI sintéticas + QA real de móvil y Admin antes de liberar.
6. **«La pestaña del perfil rompe la app»:** conservar los enlaces viejos, shell global, cinco destinos y reproductor persistente.

---
**Decisión para implementación:** primero construir una **entrada móvil impecable** y subpantallas funcionales **sin borrar ni reescribir los motores actuales**. El objetivo es reorganizar productos y flujos, no cambiar tecnología por estética. La aprobación de este documento no significa que las seis pantallas nuevas estén implementadas o desplegadas.
