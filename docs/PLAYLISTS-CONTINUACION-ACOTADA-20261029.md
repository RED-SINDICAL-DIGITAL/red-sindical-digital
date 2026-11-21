# Playlists: continuación acotada — 29/10/2026

Rama Pages staging. El avance automático de la cola carga como máximo tres páginas por operación cuando no encuentra un tema reproducible. Después libera el estado ocupado y ofrece continuar con Cargar más temas, conservando cursor y temas cargados. No limita el tamaño total de la playlist ni bloquea la carga manual.

Los cursores mayores a 2048 caracteres se rechazan antes de guardar una página; la respuesta puede reintentarse sin contaminar los cursores vistos. Se actualizó la versión del recurso en app.html para evitar reutilizar el JS anterior.

691 pruebas Pages aprobadas. Regresiones nuevas: tres páginas no disponibles no producen más consultas automáticas; continuación manual conservada; tema reproducible en tercera página se inicia; cursor sobredimensionado no modifica la cola y permite reintento.

No certifica reproducción audible ni prueba de este caso con proveedor real. No cambia Worker, cuentas o producción. Recuperación de Bolsa y vencimiento remoto de destacados siguen pendientes separados.
