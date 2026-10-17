# Abrir artista desde Mi perfil — 17/10/2026

## Comportamiento

Abrir mi espacio y los enlaces privados de presentación, consultas y PRO comparten un guardado de apertura por tarjeta. Mientras se comprueba el acceso se muestra Abriendo… y se evita enviar otra petición desde esa misma tarjeta. Ante fallo se conserva el acceso guardado, se restaura el control y se permite reintentar explícitamente.

Cada selección privada obtiene una generación global: si se elige otro artista, el resultado anterior no guarda su token ni redirige. También se descarta si cambió la cuenta o desapareció la tarjeta. session admite una comprobación de vigencia antes de persistir, conservando el comportamiento de sus demás consumidores.

La tarjeta se considera vigente por cuenta y conexión al DOM, no por el número de comprobaciones de cuenta. Esto evita que una comprobación por foco que no redibuja la tarjeta inutilice sus controles. La respuesta pública usa la misma vigencia de cuenta/tarjeta más el ID exacto del artista, sin invalidarse por una comprobación sin cambios.

## Pruebas

46 pruebas locales satisfactorias, incluidas 7 nuevas que ejecutan los controles del módulo completo con DOM mínimo: doble clic, cambio de cuenta, dos artistas con respuestas invertidas, fallo y reintento, destino de presentación, tarjeta retirada y comprobación de cuenta sin cambios. Se repitió satisfactoriamente la integración real cliente → Worker → SQLite aislados. Sintaxis del módulo satisfactoria.

CI y versiones de caché se actualizan en Mi perfil, Gestionar artista y Mi espacio. Pendiente resultado de CI y entrega de assets en staging. No se prueba aquí la navegación privada con propietario autenticado en navegador, ni dos dispositivos físicos. No se cambia Worker, publicación, PRO ni pagos.
