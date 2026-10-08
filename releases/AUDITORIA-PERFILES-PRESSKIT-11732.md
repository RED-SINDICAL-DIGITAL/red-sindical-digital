# Perfiles, herramientas y Press Kit · revisión 11732 / interfaz 12015

## Cambios implementados
- Mi cuenta comprueba el acceso de artista guardado en ese dispositivo y muestra enlaces para editar, ver el perfil público y abrir el Press Kit publicado.
- El perfil público muestra el acceso al Press Kit sólo cuando el servidor confirma una publicación disponible. No se inventan secciones sin contenido.
- Página pública y vista previa usan el mismo diseño y los mismos campos: nombre, disciplina, ciudad, foto, presentación, trayectoria, video externo, espectáculos, duración, público, integrantes, montaje, requisitos técnicos y contacto.
- Los bloques vacíos se omiten. Presupuestos, precios base, clientes y agenda no forman parte de la presentación.
- Compartir permite compartir el enlace o copiarlo; PDF utiliza la impresión del navegador.
- El primer borrador utiliza los datos existentes del perfil. Los borradores ya guardados no se sobrescriben.
- Guardado de herramientas bloquea controles mientras la solicitud está en curso. Los errores mantienen el borrador en pantalla.
- El acceso sin PRO explica el modo de lectura. Sin acceso de artista ofrece pasos de recuperación y creación.
- Corrección del nombre artístico al editar y del mensaje de confirmación que desaparecía al volver a dibujar el formulario.
- Admin explica que habilitar un Press Kit no publica un borrador e incluye enlaces de comprobación al perfil y al kit público.
- Worker 11732 bloquea el enlace público cuando el Press Kit está deshabilitado y rechaza publicar en ese estado. El acceso privado GET comprueba también que el reclamo siga perteneciendo al propietario vigente.

## Cómo usarlo
1. En Mi cuenta, abrir el perfil de artista. Si este dispositivo no tiene acceso, abrir el enlace privado de gestión.
2. En Mi perfil y plan, habilitar Press Kit si corresponde.
3. Con PRO vigente, entrar a Press Kit y herramientas, revisar el borrador y cargar los espectáculos.
4. Usar Vista previa; después Guardar y publicar presentación.
5. Abrir la presentación compartible y compartir su URL pública. Guardar cambios posteriores no actualiza la copia pública: volver a publicar.
6. Retirar presentación pública elimina su disponibilidad pública y conserva el borrador privado.

## Despliegue
La interfaz 12015 se publica por GitHub Pages. Reemplazar el Worker por worker-UADAVSTREAM-V11.7-11732.js y comprobar /api/health: build 11732. Se conservan bindings KV/D1, claves y configuración; no requiere nueva migración.

## Verificación y límites
Pruebas automatizadas: permisos, vencimiento, revisión concurrente, PRO, separación público/privado, deshabilitación de Press Kit, escape de texto, URLs peligrosas, omisión de datos privados y sintaxis de páginas relacionadas. Prueba visual con datos ficticios en tests/presskit-preview.html.
La cuenta de entretenimiento sincroniza sus datos entre dispositivos; el permiso privado de artista sigue siendo independiente y se comprueba en cada dispositivo. No se copian tokens privados a favoritos ni al perfil público.
Sin sesión autenticada no se ha ejecutado un guardado real en Admin o en un perfil privado de producción. La prueba visual no representa una cuenta real ni un ensayo en dispositivos físicos.
