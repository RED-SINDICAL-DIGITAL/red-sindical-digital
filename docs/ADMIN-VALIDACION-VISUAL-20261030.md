# Admin staging · validación visual 30/10/2026

Acceso administrativo renovado mediante formulario seguro, sin exponer credenciales. El panel identifica explícitamente la API staging y D1 OK.

Prueba de conservación de borrador: se escribió un título temporal en Landing promocional; se abrió la sección existente Escena y movimiento y se aplicó Guardar sección (borrador). Tras el nuevo render, el título temporal siguió presente. Se restauró el título original en pantalla y se recargó el Admin, descartando el borrador de la prueba. Se verificó que el título persistido original seguía intacto.

No se pulsó Guardar cambios, no se publicó el texto de prueba ni se crearon o eliminaron registros. Producción sin cambios. Esto completa la comprobación visual pendiente de conservación de campos; no simula un fallo real de red ni certifica guardado transaccional. Las regresiones de doble envío y fallo parcial están cubiertas por la suite de 747 pruebas CJS aprobada en 970c80c.
