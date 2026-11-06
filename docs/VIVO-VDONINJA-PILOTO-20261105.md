# Prueba de cámara VDO.Ninja — staging

Ruta aislada: /vivo-prueba.html. Solo funciona como página superior en https://uadav-stream-staging.pages.dev. No registra artistas ni modifica Worker, cuentas, solicitudes, pagos o producción.

Decisión: recomendar YouTube a quienes tengan canal habilitado; permitir cámara VDO.Ninja para quienes no lo tengan. Sin contratar Cloudflare Realtime ni Meshcast.

Primera prueba: cámara y audio con dos invitados como máximo solicitado mediante maxviewers=2. Video solicitado y limitado por emisor a 400 kbps por conexión. No garantiza estabilidad; requiere validar celulares, red y comportamiento real de VDO.Ninja. La página corta su iframe después de 15 minutos mientras se ejecuta; no es una revocación remota ni un límite de servicio. Pagehide y Finalizar descargan el iframe. Los temporizadores del navegador pueden retrasarse en segundo plano.

Cada sesión usa identificadores y contraseña aleatorios. Invitación en fragmento URL, sin almacenamiento en UADAV ni API. Al abrir explícitamente el iframe, VDO.Ninja recibe el identificador y contraseña en su URL. Los invitados son personas de confianza: este piloto no ofrece identidad verificada, control de admisión backend ni revocación de enlaces. No publicar enlaces. El espectador no recibe permisos de cámara/micrófono en el iframe.

No se solicita grabación; los espectadores pueden capturar pantalla y UADAV no certifica la política del proveedor. Debe aceptarse conexión mediante VDO.Ninja y sus condiciones antes de preparar cámara. La conexión puede ser directa o usar relés de VDO.Ninja; no se promete ausencia de infraestructura externa ni servicio ilimitado.

Chat, gorra, vinculación con perfil y catálogo público están pendientes; esta página lo informa. No simula donaciones ni muestra cobros ficticios. No iniciar emisión mediante el agente sin autorización para captar cámara/micrófono.

Validación: 11 comprobaciones locales aprobadas (invitaciones, host, permisos del espectador, consentimiento, descarga de iframe y build aislado). Build de staging generado. Pendiente recorrido audiovisual real: celular emisor + otro equipo espectador, audio, finalización, pérdida de red y tercer espectador. No se acredita capacidad de 100 artistas o espectadores.
