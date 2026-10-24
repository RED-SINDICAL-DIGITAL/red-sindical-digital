# Mis trabajos · preparación de Bolsa 11759

La herramienta de respaldo ya confirmó D1 consistente con 6 ofertas y 6 postulaciones. La nueva integración se mantiene limitada al origen y a la API exactos de staging.

## Experiencia preparada

Cuando la cuenta y el Worker confirman disponibilidad, los formularios ofrecen **Guardar esta oferta/postulación en Mi Perfil**. La elección de no guardar se conserva al volver a comprobar la conexión. Publicar y postularse sin cuenta continúan disponibles con sus comprobantes privados.

En **Mi Perfil → Mis trabajos y postulaciones** aparecen las gestiones de la cuenta y las acciones correspondientes: revisar postulantes, cerrar/renovar una oferta y quitar una gestión de la lista. Los comprobantes antiguos se vinculan pegando el código o abriendo el TXT y confirmando la cuenta de destino. No se conserva la clave del comprobante en almacenamiento local ni en los datos sincronizados de la cuenta.

El código anterior de consulta por comprobante se conserva como alternativa. Si el Worker todavía no es 11759 o falta el esquema, se informa que la integración no está disponible y se mantienen las herramientas existentes; no se anuncia un guardado automático sin confirmación del servidor.

Las listas y respuestas privadas se descartan si la cuenta cambia, incluso si vuelve a la cuenta anterior. Los campos opcionales del postulante se muestran según lo autorizado. Los títulos y mensajes se construyen como texto; los enlaces de contacto validan su protocolo y no admiten credenciales embebidas.

## Avisos y respaldos

La campana existente recibe avisos internos de nueva postulación y cambios de estado. Marcar leído modifica el aviso, no la postulación. Esto no demuestra entrega por correo ni Web Push.

El panel Admin sigue descargando el backup actual de D1. Si el Worker informa asociaciones disponibles, también comprueba que cada vínculo corresponda a un registro y una cuenta presentes, sin duplicados. El informe para compartir no incluye sus datos privados.

## Activación y verificación pendientes

El Worker 11759 y `migrations/staging/20261024_job_accounts.sql` se encuentran en la rama Worker. Requieren intervención manual en Cloudflare; la guía está en `docs/BOLSA-11759-MI-PERFIL-STAGING.md` de esa rama. Mantener los flags actuales de D1 y la recuperación por correo deshabilitada.

Las 84 pruebas de Pages están aprobadas localmente. La prueba remota detectó que las acciones de la postulación están dentro del cuerpo del modal: la opción de cuenta debe insertarse en ese contenedor, no directamente en el formulario. Se corrigió la inserción y el fixture ahora reproduce esa estructura y rechaza referencias que no son hijas del contenedor.

El circuito de cuenta se probó en el navegador de PC de Work: oferta y postulación guardadas, una segunda candidatura sin vincular, persistencia tras recargar, campos opcionales excluidos, cierre/renovación y avisos leídos. Desde Admin se pasó únicamente la candidatura ficticia a «En revisión» y la cuenta recibió el estado y el aviso correspondiente.

Esta prueba también detectó que Actualizar mis trabajos conservaba un panel anterior de postulantes. El refresco ahora lo retira e invalida respuestas de bandeja que empezaron antes, para que no vuelvan a pintar un estado obsoleto. Los tests cubren tanto una bandeja ya recibida como una respuesta pendiente. Se corrigieron además los textos de una única gestión y una única postulación.

Falta repetir en móvil y con una segunda cuenta independiente, probar un comprobante previo y la restauración remota en una base desechable. No declarar Bolsa terminada ni pasar a producción por la sola presencia de esta interfaz.
