# UADAV STREAM — Auditoría integral de simplificación
**Fecha:** 26/11/2026  
**Autoridad funcional:** producción actualmente publicada, no la antigüedad de los archivos ni la versión de staging.  
**Estado:** auditoría estática amplia + observación de solo lectura de pestañas productivas; pendientes los recorridos reales end-to-end y la verificación del SHA servido por Cloudflare. No es aprobación de despliegue.

## Política de producto obligatoria

> **Menos pantallas, menos elementos innecesarios, más experiencia de aplicación y ninguna pérdida de funciones.**

Prueba de facilidad: una persona mayor o sin experiencia técnica debe poder escuchar, guardar, descubrir, encontrar trabajo, publicar un evento y acceder a su cuenta sin comprender términos de programación. El **Admin** retiene su poder: datos, permisos, segmentaciones, moderación, diagnósticos, publicaciones, integraciones y backups deben permanecer disponibles, aunque se agrupen en tareas sencillas.

### Reglas de conservación

1. **Producción es contrato funcional**, no fuente única de código. Antes de tocar una función, registrar URL, usuario/rol, acción, resultado, versión y evidencia. Validar SHAs de Cloudflare Pages y Workers antes de hacer afirmaciones sobre equivalencia con GitHub.
2. Unificar navegación y diseño **sin alterar IDs, eventos, API, D1, KV ni las claves del almacenamiento** salvo migración probada, reversible y aprobada.
3. **Eliminar elementos visuales redundantes** después de probar que existe el mismo camino sencillo, accesible y funcional.
4. **Ocultar o fusionar** funciones opcionales y avanzadas, manteniendo sus permisos del lado servidor. Una opción oculta no equivale a una función eliminada.
5. **Borrar código definitivamente** solo con pruebas de ausencia de referencias, tráfico/uso o dependencias, y rollback seguro. Nunca borrar datos, credenciales, backups o historiales por una decisión de diseño.
6. Mantener módulos de activación administrativa sin duplicar menús públicos cuando están deshabilitados.
7. Verificar siempre **móvil, PC, tablet, PWA y TV**, navegación de teclado, lectores de pantalla y redes lentas; evitar scroll horizontal no intencional y superposición del player con la navegación.

## Inventario revisado en GitHub (main)

| Área | Función que debe conservarse | Complejidad/redundancia detectada | Acción |
| --- | --- | --- | --- |
| Shell/PWA | Navegación, instalación, búsqueda, perfil | `app.html` contiene múltiples capas de estilo y controles de player; la integración usa iframes | Mantener lógica; rediseñar visualmente por una sola capa sometida a QA (PR #73), después reducir reglas duplicadas |
| Explorar/Portada | Música, artistas, géneros y colecciones | Accesos a secciones opcionales aparecen en portada | Filtrar por flags activos y conservar descubrimiento sin registrarse |
| Artistas | Perfil público, registro, reclamación, propiedad y permisos | Flujos históricos de reclamo y alta se superponen en pruebas | Auditar titularidad y diferenciar alta propia/reclamo existente antes de fusionar pantallas |
| En vivo/Radio | Reproducción continua, metadata, cola, chat y Studio | Controles en varios niveles | Un reproductor compartido con acciones primarias y menú avanzado |
| Mi Perfil | Datos, artista, trabajos, eventos, biblioteca, seguridad | 4 acciones primarias + enlaces secundarios repetidos; 46 bloques `<style>` en HTML | Mantener 4 tareas; detalles avanzados colapsados; retirar accesos duplicados verificados |
| Biblioteca | Historial, favoritos, ver más tarde, playlists, seguidos, radios | Seis colecciones; no hay que fusionar datos almacenados | Una pantalla con pestañas; búsqueda simple y reanudación solo tras validar conflictos entre dispositivos (PR #71/#72) |
| Cartelera | Publicar, gestionar y buscar eventos | Módulos comerciales adicionales controlados por flags | Listado primero; «Publicar evento» destacado; opciones avanzadas al abrir |
| Trabajo | Ofertas, búsquedas, postulaciones, comprobantes privados | Múltiples herramientas para usuarios y operadores | Listado primero; asistente de publicación y estado comprensible, sin perder comprobantes |
| Administración | Control editorial, artistas, trabajo, cartelera, radios, fuentes, publicidad, analíticas, moderación, sistema, auditoría, backups | `admin.html` ~323 KB, 177 bloques `<style>`; «Campañas y banners» / «Campañas y promociones» se parecen pero no se ha confirmado equivalencia | Agrupar por tareas y mostrar acciones frecuentes primero; **NO borrar ninguna sección sin comparar sus endpoints y permisos** |
| Cuentas/Correo | Enlace privado, acceso desde otro dispositivo, recuperaciones, permisos | Métodos históricos coexisten con correo primero | Correo sencillo al frente; mecanismos de emergencia detrás de seguridad; jamás exponer secretos |
| Modulación | `uadav-module-policy.js` gobierna `podcasts`, `ticketing`, `pro`, otros | `pro` forzado a falso, `ticketing` falso por defecto, `podcasts` configurable | Mantener control administrativo; **no eliminar endpoints ni datos solo porque la sección esté oculta** |

### Limpieza aplicada y verificada por revisión del código

- Quitado el enlace secundario «Podcasts · Audio y video» de la subsección plegable «Tu biblioteca» en `usuario.html`. La acción no era una categoría de biblioteca y podía confundir al usuario. La ruta `/podcasts.html`, el módulo `podcasts`, la entrada de portada bajo su flag y la administración de Podcasts **se preservan**.
- Añadido `scripts/audit-ui-surface.mjs`: inventario estático de las diez páginas principales, tamaño de HTML, estilos/scripts embebidos, referencias a rutas y posibles repeticiones. **Los resultados son pistas**, no permiso automático para borrar.
- Añadido `tests/production-baseline-simplification.test.cjs` para asegurar las cuatro tareas principales, biblioteca, módulos opcionales, protecciones de membresía retirada y claves de sincronización.
- El rediseño estético aislado del reproductor sigue en PR #73, **no incluido ni desplegado** en esta limpieza.

## Simplificación adicional del Centro de Control (PR #74)

- `admin.html` conserva el inventario `NAV` como fuente única de las herramientas. La barra lateral muestra ahora un grupo abierto **USO DIARIO** con seis tareas reconocibles: Resumen, Pendientes, Artistas, Trabajo, Cartelera y Radios. Estas entradas se extraen de los grupos anteriores y **no se duplican**.
- Todas las secciones no frecuentes siguen en sus grupos plegables; el menú abre automáticamente el grupo de la sección activa y la búsqueda sigue filtrando el inventario completo.
- Los controles de módulos siguen limitando el acceso visual a las opciones desactivadas (sin sustituir comprobaciones de permisos del servidor).
- Se agregó `tests/admin-daily-navigation.test.cjs` para verificar que cada operación disponible aparece exactamente una vez, la búsqueda encuentra opciones técnicas y las secciones desactivadas no aparecen.
- No se cambiaron rutas, operaciones, permisos, claves administrativas, almacenamiento o lógica de publicación. **Se requiere QA visual y de navegación en entorno controlado** para revisar el resultado.

## Simplificación de Explorar y En vivo (PR #74)

- La portada presenta **una sola entrada «En vivo y radio»** en el selector principal, eliminando el acceso grande duplicado a Radio. El texto responde a los flags activos: «En vivo» sin radio, «Radio» sin TV, y se oculta si ambos módulos están inhabilitados. No se elimina la sección de emisoras (`radioSection`), sus contenidos ni la ruta `radio.html`; dentro de `en-vivo.html` permanecen los accesos «Transmisiones» y «Radios».
- El bloque de reproducciones recientes se llama ahora **«Tu historial reciente»**, en lugar de prometer «Continuar viendo y escuchando». Es una descripción fiel del comportamiento verificado: `index-v117.html` renderiza historial local sin reanudar explícitamente posiciones en el último segundo. La reanudación real sigue en PR #72, aislado y pendiente de pruebas entre dispositivos.
- `tests/home-live-radio-simple.test.cjs` comprueba ruta compartida, los dos formatos dentro de En vivo, emisoras en portada y controles de radio intactos. Está incluido en las pruebas de preservación de staging; mantener sin despliegue hasta QA de dispositivos y flags.

## Hallazgos a investigar, no eliminados

**P0 Seguridad y despliegue:** diferencia entre hash congelado de `worker.js` en staging y Worker de `main` (gate de preservación fallido); prueba antigua de ciclo de reclamo de artista incompatible con una parte del flujo actual. La API de producción observada indica V11.7 y D1 OK en su propia interfaz, sin verificación independiente. La presencia de un enlace de correo y del player no demuestra su funcionamiento completo. Reenvío al mismo Gmail aún bajo observación.

**P1 Deuda visual:** HTML/estilos embebidos extensos, especialmente Admin y Mi Perfil. No retirar bloques CSS por coincidencia textual: medir especificidad, breakpoints y comportamiento del player en mini/fullscreen, radio, accesibilidad y TV. Un solo design system, preferentemente externo y cacheable, con revisión visual antes de sustituir lo anterior.

**P1 Diseño del Admin:** dos opciones publicitarias con nombres similares y controles técnicos distribuidos. Determinar si son herramientas distintas o duplicadas mediante rutas/operaciones y usuarios autorizados. En el rediseño mostrar un panel «Hoy» y acciones frecuentes, y relegar diagnóstico/seguridad/migración a un menú avanzado, sin perder ninguna.

**P1 Sincronización:** el historial completo se sincroniza como colección; la reanudación añadida en PR #72 requiere prueba de conflictos entre dispositivos y no debe sobrescribir posiciones recientes.

**P2 Opcionales:** evitar accesos a `podcasts`, `ticketing` y funciones pausadas desde vistas públicas que no respeten flags activos. Auditar cada link, no borrar módulos administrables.

## Criterios para cerrar la auditoría

1. Verificar commit de Pages, versión del Worker y referencia de D1/KV con acciones de **solo lectura** y registrar pruebas por módulo.
2. Comparar los flujos productivos por rol: visitante, usuario por correo, artista verificado, postulante, operador/administrador y radio. No usar cuentas personales para ensayos destructivos.
3. Resolver pruebas de titularidad y preservación sin desactivar mecanismos de seguridad ni actualizar hashes arbitrariamente.
4. Confirmar equivalencia antes/después de cada simplificación: se llega a la misma función y se obtiene igual resultado, en menos pasos y con controles accesibles.
5. Habilitar eliminación definitiva solo con evidencia de uso cero/dependencias cero y alternativa o migración completa; documentar rollback y responsabilidades.
6. Desplegar primero en staging aislado, validar y recién entonces fusionar por etapas. Ningún cambio de esta rama ha sido publicado.

**Decisión:** producir una experiencia unificada y sencilla sin convertir «limpieza» en pérdida de herramientas para administración o artistas. Esta rama es candidata para PR y QA, no para eliminación masiva de archivos ni producción.
