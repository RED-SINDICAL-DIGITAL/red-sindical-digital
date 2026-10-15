# Usuario del artista y bandeja — 15/10 UTC, 14/10 Argentina

La bandeja Consultas recibidas de PRUEBA VISUAL QA 2235 se verificó en navegador staging: carga completada, cero consultas, filtros y Actualizar disponibles. No se enviaron consultas a personas reales. GitHub Actions del commit 994dd6a62a0567febf9d0a8d588096097d4cb6fa terminó satisfactoriamente en ambos flujos.

Se mejoró el editor de nombre de usuario: fallos ofrecen Volver a comprobar y dejan de atribuir cualquier error a una versión vieja del Worker; perfiles privados no ofrecen Abrir perfil público; cuenta capturada antes de la operación se comprueba antes de solicitar y después de interpretar JSON, tanto al leer como al guardar.

Tres pruebas locales pasan: enlace público oculto en perfil privado, error con reintento, respuesta posterior al cambio de cuenta rechazada. Sintaxis correcta. Pruebas agregadas a CI. Falta la comprobación visual desplegada del editor y la prueba de guardar un usuario en staging. No se ha demostrado ni corregido una causa de latencia del backend; el cambio mejora recuperación y privacidad. No se alteró producción ni Worker.
