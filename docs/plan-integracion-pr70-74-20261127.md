# UADAV Stream — Secuencia segura de PR #70–#74 (27/11/2026)

**Referencia funcional:** producción Cloudflare. **Premisa:** menos pantallas y elementos, más experiencia de aplicación, ninguna pérdida de funciones. Esta tabla identifica colisiones de archivos en GitHub; **no es una autorización de merge ni de deployment**.

## Matriz de integración

| PR | Alcance | Archivos cambiados | Colisiones con PR #74 | Decisión provisional |
|---|---|---|---|---|
| #70 | Correo y recuperación de acceso | `uadav-profile-email.js` | Ninguna colisión directa; depende del orden y ubicación de elementos en `usuario.html` | **Integrar tras validar autenticación y acceso real**. El email de contacto no prueba titularidad; mantener verificación y recuperación |
| #71 | Búsqueda más clara en biblioteca | `biblioteca.html`, test propio | `biblioteca.html` | **Fusionar manualmente** con los estados vacíos implementados en #74. Mantener un solo control «Limpiar búsqueda», seis categorías y los enlaces de acción |
| #72 | Reanudar video desde historial | `app.html`, `biblioteca.html`, test propio | `biblioteca.html` y controles de reproductor/estado compartidos | **Después de #71**, integrar con funciones de guardado de posición, sin escribir registros duplicados ni invalidar sincronización entre clientes; validar reanudación y saltos de posición |
| #73 | Apariencia app nativa | `app.html`, `uadav-app-surface-v1.css`, workflow/tests/docs | Coincide con controles/CI del #74 en workflow y tests de shell | **Al final**, aplicar estilos con CSS aislado, revisar móvil/TV y respetar `prefers-reduced-motion`, accesibilidad y `hidden` |
| #74 | Auditoría, Admin, Explorar, Cartelera, Trabajo y Mi Perfil | 28 archivos; `worker.js` no modificado | Base del orden seguro | **Primero cerrar CI y gates de deployment**; conservar en borrador mientras falte comparación interactiva |

## Reglas que no se pueden perder

1. Los favoritos, playlists, artistas seguidos y radios favoritas deben conservar sus claves y la sincronización entre clientes, sin mover el almacenamiento a otra colección.
2. En Biblioteca, los estados vacíos y el botón de limpiar búsqueda se complementan. No mostrar un CTA de «Descubrir» cuando un filtro de texto simplemente no devuelve resultados.
3. `app.html` conserva el audio de radio, el minirreproductor, navegación persistente, acceso a biblioteca y controles de sesión. La reanudación no debe reproducir dos instancias ni guardar posiciones de contenido no compatible.
4. Las funciones profesionales (reclamación, ficha artística, Trabajo, Cartelera) y herramientas administrativas no se eliminan por simplificación estética; lo secundario se agrupa.
5. **Ninguna operación de merge o despliegue** hasta que CI, revisión visual y contrato API con producción estén aprobados.
6. Las pruebas de Turnstile solo pueden utilizar simulaciones en ambientes aislados; la configuración real no se apaga ni se prueba con credenciales por chat.

## Gate propuesto

- Confirmar con Work el SHA y versión publicada de Pages + Workers y reconciliar las diferencias con GitHub.
- Aprobar PR #74 sin modificar Worker y comprobar aplicación en staging **sin datos reales**.
- Incorporar PR #70, #71, #72 y #73 en una **rama de integración** sobre la referencia ya aprobada, revisando los cambios por archivo, no con merges automáticos de ramas antiguas.
- Ejecutar CI completo + QA real en móvil 320/390 px, escritorio y TV; visitante, cuenta, artista propietario y usuario no autorizado; radio de fondo, favoritos, playlists, publicar, postulaciones, reanudación y cuenta.
- Definir rollback antes de autorizar el despliegue y comparar regresiones con producción.

**Situación conocida al elaborar este documento:** cuatro jobs rápidos del PR #74 aprobados; la QA visual final aún ejecutaba el recorrido largo de navegador.
