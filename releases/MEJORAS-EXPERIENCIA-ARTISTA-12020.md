# Experiencia privada del artista · interfaz 12020

- Consultas con búsqueda por nombre, evento, ciudad y referencia; filtros por estado; total y nuevas; botón Actualizar y carga progresiva de todas las coincidencias.
- Fechas día/mes/año y números agrupados. Se conserva la moneda indicada en texto; los importes anteriores sin moneda no reciben una moneda inventada.
- Botón WhatsApp cuando el contacto tiene formato numérico válido. Abrir email o WhatsApp no envía mensajes automáticamente.
- Estado guardado con confirmación visible y reversión visual si falla. Mientras guarda se bloquean filtros y acciones para evitar cambios simultáneos en esa pantalla.
- Menú móvil en dos columnas y opciones secundarias desplegables. Se reemplaza el texto técnico de migración por Acceso privado activo, sin afirmar verificación de identidad que no corresponde.
- El artista conserva la sección elegida al actualizar, dentro de ese navegador. Al cambiar de sección, los formularios con cambios sin guardar piden confirmación antes de descartarse.
- La pantalla vuelve al comienzo de la sección al navegar; se respeta la preferencia de movimiento reducido.

No requiere otro Worker: utiliza los permisos y la bandeja del 11733. No modifica consultas reales, permisos, PRO, precios o notificaciones automáticas. Pruebas automatizadas de filtrado, fechas, contactos, presupuesto y regresión de permisos. Prueba visual con datos ficticios en tests/artist-profile-preview.html. La captura aportada confirma que la consulta real aparece, pero no se cambió su estado ni se respondió al cliente.
