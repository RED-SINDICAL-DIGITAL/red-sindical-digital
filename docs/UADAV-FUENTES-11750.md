# Fuentes automáticas · Worker V11.7 build 11750

## Qué cambia

- Desde Admin se puede agregar, editar, activar, pausar, revisar y borrar cada fuente de Cartelera o Bolsa de Trabajo.
- Una fuente nueva queda pausada. Activarla sólo permite encontrar candidatos; nunca los publica automáticamente.
- Cada candidato se puede abrir en el sitio original, revisar con la vista previa y publicar o descartar individualmente.
- Borrar una fuente elimina su configuración y los candidatos pendientes. Conserva eventos y oportunidades ya publicados.
- Si se borran todas las fuentes, la lista permanece vacía. El Worker no vuelve a cargarlas en visitas posteriores.
- Las fuentes nuevas y editadas deben usar HTTPS público. Las fichas puntuales existentes siguen disponibles.
- El lugar de los candidatos usa país, provincia y ciudad configurados en la fuente.

## Despliegue

1. Publicá el frontend del repositorio para habilitar la pantalla nueva del Admin.
2. Descargá `releases/worker-UADAVSTREAM-V11.7-11750.js` y pegalo en el Worker de Cloudflare, conservando los bindings y secretos actuales.
3. Guardá y desplegá el Worker. No hay que cambiar la clave de Admin.
4. Entrá a Admin → Fuentes automáticas. Probá editar una fuente existente, revisar una candidata, borrarla y confirmar que las publicaciones aprobadas sigan en Cartelera/Bolsa.

La versión del Worker no se publica automáticamente desde este repositorio; el administrador del sitio la despliega manualmente.
