# Mi Perfil y vigencia de destacados — 29/10/2026

Solo rama Pages staging. Mi Perfil: Mis trabajos y postulaciones se mueve junto a Mis gestiones, antes de configuración y dispositivos; se conservan IDs, cuenta, comprobantes y permisos. Mejor ajuste de nombres largos y avatar en móvil, márgenes para destinos internos y controles desplegables de 44px.

Admin Cartelera: el campo fecha del destacado recibía un timestamp completo, que el navegador mostraba vacío. Ahora muestra la fecha y, si no se cambia ese día, conserva el timestamp exacto original al guardar otro dato. Una fecha modificada usa el valor elegido; los controles de servidor permanecen. No se cambiaron campañas, cobros, secretos, cron ni producción.

Pruebas: suite completa antes del último caso 677/677, más caso integrado de edición que conserva timestamp y 8/8 pruebas focalizadas. Verificación visual tras despliegue se realiza aparte. Vencimiento remoto automático y recuperación antigua de Bolsa siguen pendientes; no confundir mejoras UI con cierre de esos circuitos.
