# Diagnóstico de la falla observada en producción

La captura no muestra una excepción JavaScript del player. Los dos mensajes visibles son de privacidad del navegador: métricas bloqueadas y almacenamiento de `i.pinimg.com`. No explican el rectángulo negro.

El flujo V9.2.1 sí tenía una condición capaz de producir exactamente ese síntoma sin error de consola: el Worker resolvía primero un `direct_url` de una instancia pública de Invidious y el navegador creaba un `<video>`. Si esa URL quedaba en estado `stalled` (hotlink, firma, CORS/proxy, política del host o URL relativa), el código sólo esperaba `error`; algunos navegadores no emiten `error` y el player queda negro indefinidamente.

V9.2.2 agrega un watchdog de 4.5 s y eventos `stalled/error/abort`, normaliza URLs relativas y cambia automáticamente a `youtube.com/youtube-nocookie embed` compatible con producción. El embed no consume YouTube Data API; Invidious continúa primero para búsqueda/resolución.

Además, la captura de KV muestra una clave `service_worker_js`. Si el frontend público sirve `/service-worker.js` desde esa clave, un valor viejo puede controlar producción aunque el ZIP local tenga el SW nuevo. Por eso V9.2.2 cambia todas las firmas a `922` y exige sincronizar esa clave con el archivo entregado.
