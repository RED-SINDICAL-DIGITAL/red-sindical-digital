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

El usuario desplegó el Worker 11759 e instaló `migrations/staging/20261024_job_accounts.sql` en Cloudflare staging. La prueba autenticada confirmó lecturas y escrituras de asociaciones. La guía está en `docs/BOLSA-11759-MI-PERFIL-STAGING.md` de la rama Worker. Mantener los flags actuales de D1 y la recuperación por correo deshabilitada.

Las 84 pruebas de Pages están aprobadas localmente. La prueba remota detectó que las acciones de la postulación están dentro del cuerpo del modal: la opción de cuenta debe insertarse en ese contenedor, no directamente en el formulario. Se corrigió la inserción y el fixture ahora reproduce esa estructura y rechaza referencias que no son hijas del contenedor.

El circuito de cuenta se probó en el navegador de PC de Work: oferta y postulación guardadas, una segunda candidatura sin vincular, persistencia tras recargar, campos opcionales excluidos, cierre/renovación y avisos leídos. Desde Admin se pasó únicamente la candidatura ficticia a «En revisión» y la cuenta recibió el estado y el aviso correspondiente.

Esta prueba también detectó que Actualizar mis trabajos conservaba un panel anterior de postulantes. El refresco ahora lo retira e invalida respuestas de bandeja que empezaron antes, para que no vuelvan a pintar un estado obsoleto. Los tests cubren tanto una bandeja ya recibida como una respuesta pendiente. Se corrigieron además los textos de una única gestión y una única postulación.

La corrección del refresco se volvió a probar en Pages publicado (`0075f41`): al refrescar la bandeja desaparece y al abrirla de nuevo devuelve el estado vigente. La lectura del aviso de cambio de estado persiste después de recargar. Se descargó y comprobó en privado un respaldo posterior: 7 ofertas, 8 postulaciones y 2 asociaciones, sin errores de lectura y con referencias consistentes. El JSON no se incorpora al repositorio.

La revisión visual coloca el título de la bandeja a todo el ancho de la grilla y aclara el acceso desde la cuenta o mediante comprobante. Las 84 pruebas específicas de Bolsa/Admin/aislamiento siguen aprobadas. Una ejecución adicional de todos los `*.test.cjs` obtuvo 509/555: las mismas 46 fallas se reproducen en el commit base `0075f41`, sin las correcciones visuales. Corresponden a otros circuitos y se mantienen pendientes; no equivale a una validación integral de toda la plataforma.

Falta repetir en móvil y con una segunda cuenta independiente, probar un comprobante previo y la restauración remota en una base desechable. No declarar Bolsa terminada ni pasar a producción por la sola presencia de esta interfaz.
