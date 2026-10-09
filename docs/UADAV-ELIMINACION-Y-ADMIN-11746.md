# Perfiles y Admin — Worker 11746 / interfaz 12041

## Dónde encontrar cada acción

| Lugar | Acción | Resultado |
| --- | --- | --- |
| Mi perfil → Tus datos → Eliminar mi cuenta | Eliminar cuenta personal | Borra nombre, foto y biblioteca sincronizada; revoca dispositivos, recuperación y sesiones vinculadas. |
| Mi perfil → Mi artista → Opciones de acceso | Eliminar perfil de artista | Quita perfil, presentación y herramientas; revoca sus accesos y cierra pedidos PRO pendientes. |
| Gestión del artista → Plan y más opciones | Eliminar perfil de artista | La misma acción, disponible para el propietario en Gratis y PRO. |
| Admin → Cuentas personales | Buscar y eliminar cuenta | Consulta nombre, último guardado y cantidades de dispositivos/artistas; carga más cuentas con paginación. No muestra bibliotecas, fotos privadas ni credenciales. |
| Admin → Artistas → Más opciones | Eliminar artista | Elimina el perfil seleccionado, con confirmación. Para una retirada temporal usar Ocultar. |
| Admin → Pendientes | Revisar, rechazar o cancelar | Las solicitudes salen de la bandeja, conservando su historial. |

Se debe escribir ELIMINAR. Una cuenta que administra artistas no puede borrarse hasta eliminar sus perfiles o transferirlos. Desvincular un artista no elimina su propiedad y no permite esquivar esta comprobación. Un enlace de gestión antiguo sin propietario acreditado no permite eliminar un artista; debe solicitarse su gestión o intervenir Admin.

## Qué se conserva

Los pagos aprobados, sus transacciones y el historial de contratación se conservan. Los eventos publicados y los contenidos externos no se eliminan por borrar al artista. Los nombres de usuario históricos quedan reservados para impedir que otro perfil se apropie de los enlaces compartidos.

Las marcas mínimas de eliminación permiten bloquear credenciales antiguas y copias importadas. Al reconectarse, los dispositivos vinculados detectan ACCOUNT_DELETED y limpian sus datos sincronizados. Un equipo sin conexión no puede limpiarse remotamente hasta volver a abrir/conectar la aplicación. No se promete borrar capturas, vistas previas de WhatsApp ni archivos de respaldo que ya fueron exportados.

La eliminación del artista confirma primero en D1 la revocación y retirada; después limpia las copias KV. Si una escritura KV falla, el perfil permanece bloqueado y la respuesta indica cleanup_pending. Admin puede reintentar POST /api/admin/artists/delete con el mismo artist_id y confirm: ELIMINAR. No se restaura el perfil ni se duplica un pago al reintentar.

## Simplificación del Admin

Acceso directo a Pendientes desde el inicio. Acciones secundarias de artista agrupadas. Se retiró la opción IA profesional y se actualizó el registro de producto: USD 3,99 mensual / USD 30 anual; IA solamente para moderación. La referencia en USD no reemplaza los importes ARS configurados en Monetización. Perfil, Bolsa de Trabajo, contratación y publicación básica de cartelera siguen gratuitos.

## Despliegue

1. Desplegar releases/worker-UADAVSTREAM-V11.7-11746.js en Cloudflare.
2. Comprobar /api/health: build 11746 y d1: true.
3. Actualizar Admin y Mi perfil con Ctrl+F5.
4. Para probar eliminación, crear una cuenta y un artista de prueba. No usar el perfil real como ensayo.

El código conserva las mejoras 11744/11745 de creación, vinculación automática, pagos y pendientes. No se borraron cuentas ni artistas de producción durante el desarrollo.
