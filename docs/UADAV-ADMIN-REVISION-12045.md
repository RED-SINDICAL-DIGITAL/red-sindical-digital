# Revisión Admin — frontend 12045

## Corregido
- Bolsa de Trabajo: retirado texto de postulación exclusiva para afiliados. Publicación y postulación gratuitas para todos.
- Sistema/proveedores: retirado asistente general de IA; acceso a Moderación, que es el uso acordado.
- PRO: cuota mensual/anual, cupo mensual de siete días y compra de destacados adicionales diferenciados. Trimestral/semestral históricos ocultos, preservados para órdenes existentes.
- Referencia comercial agrupada en desplegable; aclaración correcta de confirmación bancaria y fallback manual.
- Importación: hasta 100 contenidos por operación, sin afirmar catálogo completo.
- Consultas y comunidad: nombre consistente con consultas de contratación.
- CSS común: controles de 44px, foco visible, botones y acciones agrupados, formularios móviles, pestañas horizontales sin partir palabras, bloques técnicos con scroll. TV conserva controles mayores.

## Verificación
Pruebas de sintaxis de Admin, consultas, pendientes, pagos PRO, perfiles, sincronización y Web Push. No se enviaron mensajes, borraron perfiles ni modificaron datos reales durante la revisión.
El navegador de revisión muestra acceso administrativo, sin sesión autenticada; por eso no se completó la inspección visual de las pantallas privadas en producción. La instalación del navegador local de pruebas no pudo descargarse en este entorno. No se declara QA visual completa ni funcionamiento perfecto de todos los módulos.

## Conservado con criterio
Ticketera deshabilitada y tarjetas ocultas por módulo; compatibilidad histórica sin eliminar datos. Solicitudes anteriores, propietarios y herramientas de reparación dentro de Más opciones, para no perder trazabilidad. Aprobar pagos exige acreditación real. IA no genera Press Kit ni verifica transferencias.

## Pendiente
Inspección visual autenticada en móvil/tablet/PC/TV, comprobación en dispositivos reales de Push, validación de vinculación del artista afectado. El término Zadaía no pudo identificarse como módulo: no se cambió ninguna función basándose en ese nombre.

Esta entrega sólo modifica frontend. Worker vigente: 11749.
