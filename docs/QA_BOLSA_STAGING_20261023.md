# Bolsa de Trabajo V11.7 — Puerta de salida de staging

**Alcance:** exclusivamente Pages audit/continuidad-demo-20261019 y Worker release/radio-studio-staging-rc-20261020. Prohibido utilizar endpoints de producción.

## Seguridad de recuperación — bloqueo de despliegue

- [ ] Corregir recuperación con D1 como origen transaccional: consumir token y cambiar credencial de la oferta en una misma transacción. La implementación actual inserta token consumido en D1 y después actualiza KV; si KV falla, la recuperación queda a medias.
- [ ] Evitar que una lectura/escritura obsoleta de la colección KV reemplace cambios concurrentes en otras ofertas.
- [ ] Probar dos canjes simultáneos del mismo token: exactamente uno debe producir una clave válida.
- [ ] Probar caída de KV/D1 y webhook de correo sin revelar clave ni aceptar token usado.
- [ ] Configurar EMAIL_AUTOMATION_URL, EMAIL_AUTOMATION_SECRET y STAGING_SITE_URL en staging; verificar que el proveedor entregue el enlace seguro.
- [ ] Comprobar límites de intentos con un mecanismo atómico (no solo contadores KV) y política de borrado de tokens consumidos.

## Oferta

- [ ] Crear oferta con correo de responsable; leer desde Admin para confirmar persistencia KV y D1.
- [ ] Confirmar que el correo, hashes, claves y contactos privados no aparezcan en GET público.
- [ ] Verificar publicación inmediata, logo opcional, caducidad, cierre y renovación. Confirmar que no se borren postulaciones.
- [ ] Confirmar que las ofertas importadas externas cumplen el circuito de revisión, a diferencia de las manuales.

## Postulación

- [ ] Crear postulación sin cuenta y otra con artista vinculado, ambas sin moderación previa.
- [ ] Descargar comprobante TXT y abrirlo desde Mi Perfil; el secreto no queda persistido en el navegador.
- [ ] Asegurar que la API solo devuelve campos consentidos al contratante autenticado por clave de su oferta.
- [ ] Confirmar que una postulación de otra oferta no puede consultarse con credenciales ajenas.

## Mi Perfil y avisos

- [ ] Diseñar vinculación explícita de POST-ID + clave con cuenta existente, sin asociar por correo.
- [ ] Probar aviso de nueva postulación y estado de entrega del proveedor; no declarar enviado si solo quedó en cola.
- [ ] Probar expiración/caducidad y alertas; distinguir avisos pendientes, fallidos y entregados.

## Dispositivos y lanzamiento

- [ ] Probar PC Chrome/Edge, Android y iPhone: formularios, foco, scroll, errores, carga TXT, filtros y diálogos.
- [ ] Validar Admin, exportación, backup y restauración solamente en entorno desechable de staging.
- [ ] Auditar DevTools Network: solo uadav-api-staging, ningún request mutante a producción.
- [ ] Recién después de aprobar todos los controles: solicitar despliegue manual del Worker staging.
