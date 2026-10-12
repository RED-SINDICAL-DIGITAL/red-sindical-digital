# QA de publicidad territorial — 2026-10-12

## Cambios realizados en PR #11
- Selector: se rechaza una campaña que omite `targeting.scope` y no declara países, provincias ni ciudades. No se presupone alcance global.
- Pruebas unitarias agregadas para campañas sin alcance, alcance desconocido y filtros contradictorios.
- Se mantienen tres espacios: home, events y explore.

## Estado de validación
- Código y pruebas actualizados en rama de PR; **no se ha ejecutado aquí Node ni una prueba integrada de navegador**.
- Pendiente ejecutar `node --test tests/territorial-ads.test.cjs` en CI o entorno local y verificar el resultado.
- Pendiente probar ubicación desconocida, geolocalización por IP, datos del servidor, panel Admin, catálogo D1 y pagos.
- El módulo todavía no está conectado al frontend publicado. No fusionar ni desplegar Worker hasta validar.

## Política de publicación
- Toda campaña debe tener alcance territorial explícito y estar aprobada, publicada y dentro de vigencia.
- El servidor debe validar autorización, pago y ámbito contratado; el selector de navegador solo filtra presentación.
- Un comprobante de transferencia no constituye acreditación automática. Objetivo operativo de resolución: máximo 24 h, sujeto a verificación y mecanismos reales de control.
- Documentar cualquier cambio en el manual público y en el interno antes de activar el servicio.
