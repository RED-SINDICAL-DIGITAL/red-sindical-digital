# Diagnóstico y corrección de 33 fallos de pruebas UI

Rama exclusiva Pages staging: audit/continuidad-demo-20261019. No se modifican archivos de aplicación, Worker, datos remotos ni producción. Los 33 fallos previos no acreditaban por sí mismos 33 defectos funcionales: el diagnóstico identificó incompatibilidades de los simuladores y de sus datos con el código actual.

- Media source: la extracción de funciones incluía accidentalmente un listener global posterior y fallaba por ausencia de window; se acota a las funciones realmente ensayadas. Se conservan las comprobaciones de URL canónica, destinos ajenos y limpieza al cerrar.
- Video: el iframe simulado no implementaba addEventListener. Se agrega esa interfaz sin cambiar las comprobaciones de identidad, origen, playlist o política de referencia.
- Presentación: el fixture de respuesta exitosa omitía artist_id y bio exigidos por el contrato actual, y el módulo de compartir existía en el contexto global pero no en window. Se representan los dos accesos propios del navegador. Se conservan las pruebas de respuesta malformada y recuperación.
- Eliminación de perfil: el entorno simulado omitía location.hostname, requerido para fijar staging. Se conserva la confirmación escrita y todas las verificaciones de cuenta, concurrencia y credencial.
- Radio: el simulador no respondía a la consulta previa de modo de participación. Ahora responde como modo manual verificado para los casos de envío; la segunda llamada espera a que termine esa consulta antes de evaluar el POST. La aserción de restauración de controles sigue la política vigente: los habilita el modo confirmado de la emisora, no un disabled arbitrario de un fixture anterior. Las pruebas específicas de modo pausado/no verificado se conservan en la suite general.
- Radio Studio: faltaban location, dataset, setAttribute, temporizador de actualización, listener de visibilidad y los nodos incorporados al HTML actual. Se simulan sin timers de larga duración ni red real. Se mantienen los casos de cuenta cambiada, estación ajena, permiso revocado, respuesta perdida y envíos superpuestos.

Resultado final: 671/671 pruebas .test.cjs aprobadas, 0 fallos, 0 omitidas. No se deshabilitó ninguna prueba. Las pruebas actualizadas prueban el código actual, no sustituyen la comprobación visual móvil pendiente ni certifican reproducción real en todos los proveedores.

Cloudflare: el usuario pidió recuperar acceso con formulario seguro y seleccionó Google. La revisión automática bloqueó la observación de accounts.google.com por ausencia de autorización explícita para ese origen. No se intentó eludir el bloqueo, leer credenciales ni cambiar de método. Pendiente aprobación expresa para continuar con Google. Esto es independiente de las pruebas locales.
