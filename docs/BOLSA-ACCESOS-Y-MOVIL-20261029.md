# Cierre parcial Bolsa y validación móvil — 29/10/2026

El operador confirmó «está todo bien» después del recorrido solicitado en celular físico: búsqueda/ficha/volver en Cartelera, teclado del formulario sin enviarlo, apertura de postulación en Trabajo sin enviarla y rotación. Es validación del operador, no observación directa del agente ni prueba de envío móvil.

Bolsa: retirada de formulario oculto y handlers de recuperación antigua. Las rutas del servidor siguen devolviendo 503; no se habilitó recuperación ni se cambió autenticación. Se mantienen dos accesos explícitos: Mi Perfil para ofertas guardadas en cuenta y comprobante privado (código o TXT). Fragmentos de recuperación antigua se eliminan de la URL y muestran aviso sin canje ni envío al servidor. No se afirma que un correo de contacto permita recuperar la gestión.

675 pruebas UI aprobadas. Recorridos de publicación, postulación, acceso de contratante y cierre conservando postulaciones ya se comprobaron en staging en rondas anteriores. La revisión móvil confirmada no sustituye esos envíos previos de escritorio.

Pendientes: recuperación antigua transaccional operativa si se decide mantenerla; observación de vencimiento automático remoto de destacado. Vencimientos tienen pruebas aisladas y cron habilitado, pero no se certifica aquí un vencimiento remoto. Producción intacta.
