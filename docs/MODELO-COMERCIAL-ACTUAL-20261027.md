# Modelo comercial vigente

Decisión explícita del usuario: retirar ArtistaPRO. Esta decisión reemplaza las referencias anteriores a membresías, precios periódicos y cupos incluidos de destacados.

- Perfil artístico, publicación básica en Cartelera y Bolsa de Trabajo gratuitos.
- Promoción paga en el hero de Explorar.
- Destacados pagos en Cartelera.
- Espacios publicitarios mediante pauta o convenio, incluyendo radios y otras propuestas.
- Sin nuevas membresías, cupos mensuales ni renovación de planes para artistas.
- Ubicación, vigencia, importe y condiciones definidos por campaña o convenio. No se inventan tarifas ni se garantizan resultados.
- Preservar historial de pagos, accesos y datos de herramientas anteriores. No convertirlos automáticamente en campañas.

Implementación en esta revisión: oferta pública y guías actualizadas; acceso de artista muestra Promoción; Admin comercial muestra productos y campañas en vez de checkout de membresías; retiros de nuevas órdenes, confirmaciones bancarias de planes, cambios de planes, cupos y configuración de cobros en el código Worker. Las lecturas históricas permanecen. Los datos de cobro no se exponen por el checkout retirado.

No implica haber desplegado el Worker. No se activa EVENT_ATOMIC_STAGING ni se modifica producción. Las herramientas históricas conservan sus permisos: no se convierten sin revisión en nuevos productos ni se eliminan sus datos. Antes de desplegar, revisar cualquier pedido o confirmación bancaria que estuviera pendiente para resolverlo administrativamente.
