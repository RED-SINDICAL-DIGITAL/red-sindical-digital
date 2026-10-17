# Mi perfil: recuperación y enlaces — 17/10/2026

## Cambios

Un error temporal del servidor en la comprobación de acceso privado anterior ya no se describe como enlace inactivo. Errores de red, tiempo y respuesta ilegible usan lenguaje de recuperación y conservan el enlace guardado. Se añade Volver a comprobar acceso, visible sólo cuando falla esa comprobación. Si la cuenta ya está vinculada, esta comprobación anterior no compite con el circuito de cuenta.

Las respuestas tardías de ese acceso, del perfil público y del Press Kit se descartan si cambió la cuenta, el token o el turno de comprobación. Al retirar el token se ocultan sus herramientas y enlaces anteriores. Un Press Kit deshabilitado limpia el enlace visible previo. Los fallos de consulta del kit no quedan guardados indefinidamente; consultas simultáneas comparten la petición.

En las tarjetas de artistas de una cuenta, compartir y abrir el perfil público requieren que la respuesta corresponda al mismo artist_id, cuenta y turno, con la tarjeta conectada. No se cambia el acceso gratuito/PRO ni las reglas de publicación del Worker.

## Pruebas

27 pruebas locales satisfactorias: 13 de enlaces/recuperación (7 nuevas), 4 nuevas del módulo completo de cuenta con DOM mínimo e identidad pública, 3 de renovación/identidad y 7 de rutas de sesión. Incluyen 503 seguido de reintento correcto, error de red en lenguaje simple, cambio de cuenta, enlace de kit previo deshabilitado, fallo de kit recuperable y solicitudes simultáneas.

Pendientes: sintaxis, CI y revisión visual de Mi perfil. No se simuló un 503 en el navegador ni se recuperó una sesión real de propietario en este incremento. No se añadieron cuentas de prueba ni se modificaron tokens en el navegador. Producción, Worker y pagos sin cambios.

## Inspección y CI

Se abrió Mi perfil de staging desde /usuario; la plataforma redirigió al shell app.html con view=/usuario. La sesión observada es invitada: no hay cuenta vinculada y no aparecen herramientas privadas, enlaces públicos de artista ni Press Kit. No se crearon cuentas ni se alteraron credenciales para la prueba. Esto no valida la recuperación con un propietario autenticado ni un fallo 503 real en navegador.

Se detectó que profile-public-link.test.cjs estaba unido a otro nombre en paths del workflow y no estaba en el comando de ejecución. Se separaron los paths y se incorporaron explícitamente los tests de enlaces e identidad pública al paso de cuenta. Se corrigieron otros tres paths combinados (inbox lifecycle, presentation recovery y content editor); sus comandos existentes se conservan. No se debe interpretar CI anterior como ejecución de la prueba de enlaces que faltaba. Sintaxis de los dos módulos comprobada localmente.

## Resultado final del incremento

La versión servida incluye el nuevo botón Volver a comprobar acceso dentro del iframe de Mi perfil: un elemento presente y no visible para la sesión invitada, como corresponde sin acceso privado guardado. GitHub Actions del commit a9445567e2c35b47026ecf1d5236392296236eac finalizó correctamente: Platform integration checks 740 y Job status contract checks 344. Las 27 pruebas locales y esta ejecución ya incluyen la suite de identidad pública de cuenta y la suite ampliada de enlaces. Siguen pendientes recuperación y compartir con propietario real, fallo de red desde navegador y dispositivos físicos.
