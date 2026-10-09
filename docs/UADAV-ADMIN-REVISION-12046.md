# Revisión del Admin — frontend 12046

## Cambios
- Separé **Cobros y destacados**, **Publicidad** y **Convenio y fiscalización** en grupos de navegación propios.
- Cobros concentra PRO, pagos por transferencia, instrucciones y pedidos. Aclara que el comprobante no activa PRO: hasta integrar una confirmación bancaria real, hay que verificar el ingreso y aprobar el pedido.
- Publicidad concentra espacios, productos y campañas. Los productos/campañas dejaron de estar duplicados en Cobros. El inventario se adapta a móvil y tableta.
- Los anuncios nuevos se pueden cargar con una imagen HTTPS y un enlace HTTPS. El HTML existente permanece guardado en “Código anterior / avanzado” y se conserva al guardar si no se ingresa una imagen.
- Los códigos existentes de acceso sin publicidad siguen visibles y revocables, pero se retiró la opción para generar otros.
- Convenio y fiscalización abre con el formulario a ancho completo; eliminé accesos duplicados. El checklist extenso es plegable y los derechos musicales tienen su propio desplegable, separados visualmente del control contractual.
- SADAIC, AADI y CAPIF se presentan como seguimientos administrativos; el sistema no afirma consultar ni validar trámites en esos organismos. Se conserva el informe de derechos musicales.
- **Historial de cambios** muestra actividad; planillas y respaldos comunes quedan en Importar y exportar. El respaldo completo D1 permanece como acción avanzada.
- Actualicé el número de versión de la app a 12046 y el aviso de actualización.

## Datos y servicios
No se eliminaron productos, campañas, códigos, casos, escalas ni registros. No se cambió el Worker, D1 ni KV. El guardado conserva HTML anterior de anuncios si no se proporciona una nueva imagen.

## Verificación
- `node --check` en los scripts inline de Admin.
- Pruebas Admin de navegación, módulos, pendientes y consultas.
- Prueba de actualización de Inicio y pruebas relacionadas de cuenta, pagos, perfiles y moderación.
- Revisión visual previa en el Admin autenticado: Convenio, Publicidad, Cobros, Historial y las pantallas mostraron la mezcla de tareas y desbordes descritos. El nuevo código requiere que termine el despliegue para comprobarlo visualmente en la aplicación.
