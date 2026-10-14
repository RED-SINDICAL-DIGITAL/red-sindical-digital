# Prueba de navegador: Mi perfil y alta de artista

Entorno exclusivo: uadav-stream-staging.pages.dev, API uadav-api-staging.uadavstream.workers.dev. Fecha: 2026-10-14.

Comprobado mediante Chrome remoto y controles visibles:
- Editar nombre local ficticio y guardarlo.
- Crear cuenta desde Configuración y dispositivos; aparece Guardado.
- Buscar nombre ficticio y crear artista sin YouTube, con actividad y email example.invalid.
- Confirmación de borrador privado creado.
- Volver a Mi perfil: artista aparece automáticamente con Abrir mi espacio y aviso nuevo.

Se conservan una cuenta y un artista sintéticos adicionales. Sin publicación pública ni cobros. No se compartieron credenciales.

Trabas observadas y corregidas en rama de pruebas:
1. Usuario nuevo sin cuenta: el alta enviaba de vuelta a Mi perfil sin acceso directo a crear cuenta. Se agregó Crear mi cuenta y continuar y enlace directo Ya tengo cuenta para vinculación. Tres pruebas de helper verifican avance, fallo y doble clic; no constituye todavía validación visual del botón nuevo.
2. Añadir otro artista se estiraba a toda la altura de la tarjeta: se limitó su alineación y altura.

CORS observado: OPTIONS 204; GET account anónimo 401 con Access-Control-Allow-Origin del hostname de pruebas. El 401 anónimo es correcto.

Limitaciones: PC remoto; no se verificaron móvil físico, tablet ni TV. La edición privada, PRO, pagos, recuperación y sesión entre navegadores requieren continuar las pruebas de interfaz. Hay franja de pruebas en shell e iframe, redundancia visual pendiente. El título PLATFORM durante algunos estados proviene de configuración/branding de pruebas y requiere revisión posterior.

Los commits de la rama audit activan compilación automática del proyecto Pages de pruebas. Producción y main no se modificaron.
