# Detección En vivo y reproducción — 2026-11-04
Solo staging. Preparado, no desplegado.
La ruta public/live-artists consultaba hasta cuatro canales secuencialmente. El cliente aborta a los diez segundos; se observó HTTP 200 [] después de superar esa espera.
Corrección: cuatro consultas acotadas en paralelo. liveOnly evita fallback de metadatos oficiales, que no devuelve latestVideos ni prueba emisión. Otros consumidores conservan fallback. Solo videos explícitamente live reciben is_live:true.
14 pruebas aprobadas (12 Radio Studio + 2 regresiones nuevas). Sintaxis del Worker validada como módulo.
Prueba real Beat Digital: audio readyState=4, paused=false, currentTime avanzó de 4.097 a 10.373, sin error. Esto prueba avance de reproducción en navegador, no audición física del operador.
Beat TV: el embed oficial VWhQ6xspnSc informa "La grabación de esta transmisión en vivo no está disponible". Señal ocultada en Admin de staging, registro preservado. No se inventó reemplazo.
Desplegar exclusivamente en uadav-api-staging; conservar bindings y variables actuales. Sin migraciones ni nuevas variables. Worker completo: releases/worker-UADAVSTREAM-V11.7-11770-live-bounded-20261104.js.
Después del despliegue comprobar En vivo y public/live-artists bajo el límite de diez segundos; ausencia de transmisiones es válida y no acredita emisión.
