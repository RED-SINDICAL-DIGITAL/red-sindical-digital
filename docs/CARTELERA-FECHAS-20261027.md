# Cartelera: validación de calendario en servidor

Cambio preparado en la rama Worker de staging el 27/10/2026. No desplegado: el Worker operativo sigue en 11769 y sus archivos de entrega permanecen congelados.

El POST público de eventos valida fechas y funciones antes del circuito de moderación/publicación; la creación y edición administrativa también validan. Se rechazan días inexistentes (incluido febrero no bisiesto), horas fuera de HH:MM, fin anterior al inicio, funciones mal formadas y más de 50 funciones. Al editar solo el fin, se compara contra el inicio persistido. Las fechas históricas no se reescriben. Se admiten fechas calendario y fechas ISO con hora válida.

Pruebas sobre el Worker real, SQLite y KV locales: batería previa de 348 pruebas aprobada; después del ajuste de edición parcial, 5 pruebas específicas aprobadas (incluida la nueva prueba del inicio persistido). No se publican eventos remotos ni se envían correos reales.

Pendientes explícitos: identificador de intención persistente y publicación transaccional, respuesta perdida/reintento, proyección recuperable hacia KV y notificaciones sin duplicación. La validación de calendario no resuelve esos problemas. No usar esta fuente como reemplazo manual de la entrega 11769 sin preparar una nueva entrega y validar integración.

## Evidencia de Bolsa obtenida durante la continuidad

El operador importó una oferta real del Teatro Colón (imported=1, updated=0). Desde el Admin de staging se reimportó el CSV original: imported=0, updated=1. La tabla mantuvo 15 oportunidades, una sola fila del Teatro Colón, oculta. La exportación aportada por el operador coincide con JOB-EXT-8AC153AF, activo=false, fecha_limite=2026-11-23 y application_mode=external_url. La navegación del enlace oficial desde la tarjeta no fue observada por el agente.
