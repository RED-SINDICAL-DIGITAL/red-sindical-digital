# UADAV STREAM — QA móvil, perfil y consola
Fecha: 7 de noviembre de 2026. Exclusivamente staging. Auditoría incremental; no implica beta completa.

## Evidencia recibida
- Captura nueva de Edge DevTools: cero errores, cinco advertencias y dos informativos.
- PR #35 resolvió fallos de hojas CSS servidas como HTML. Nueva captura ya no exhibe errores MIME.
- El Inicio de Mi Perfil ya muestra avatar, accesos en lista y reproducción reciente en escritorio y móvil emulado.

## Diagnóstico de advertencias
- Edge no reconoce cuatro funciones recibidas en Permissions-Policy: attribution-reporting, private-aggregation, join-ad-interest-group y run-ad-auction. No se encontraron en app.html ni en un archivo _headers del repositorio; investigar cabeceras reales en Cloudflare antes de cambiar políticas.
- Metadato apple-mobile-web-app-capable: conserva compatibilidad Apple; se añadió mobile-web-app-capable para navegadores modernos.
- Banner not shown / beforeinstallprompt: el instalador propio cancela el diálogo automático y llama a prompt() solamente tras un clic real sobre Instalar. Es el flujo previsto, no un fallo de reproducción.
- Lazy-loaded images / placeholder: mensaje informativo del navegador; no desactivar optimizaciones sin evidencia.

## Cambios implementados en esta pasada
- Metadatos PWA modernos conservando soporte Apple.
- Al navegar a otra vista interna, el contenedor restablece scroll del iframe al principio, excepto deep links con ancla.
- Pruebas automáticas de etiquetas PWA, navegación y sintaxis JS.

## Comprobaciones reales pendientes
1. Ingresar a Mi Perfil desde otra sección: cabecera y scroll empiezan arriba.
2. Abrir Mi artista, Mis trabajos y Cuenta y seguridad; volver sin datos perdidos.
3. Reproducir, cambiar pestaña y conservar estado.
4. Recuperación de correo en otro dispositivo, sin exponer claves.
5. Instalador solo tras pulsación del usuario.
6. Verificar Response Headers en Cloudflare y su configuración antes de silenciar o quitar funciones Permissions-Policy.
7. QA en móvil físico, tablet, PC y Smart TV (foco y mando).

## Pendientes beta no completados
- Pantallas visuales dedicadas para artista, trabajos, eventos, biblioteca y seguridad.
- Verificar API de propietario para Mis eventos sin inventar endpoints.
- Auditoría integral de Cartelera, Bolsa, publicidad por provincia y Admin.
- Pruebas reales de Cast/AirPlay por tipo de medio y autorización del proveedor.
- Validar deploy de Pages, cobertura de datos e integración con Worker staging.

No tocar producción ni borrar cuentas, favoritos, ofertas, eventos, KV o D1 por una falla visual.