# Entrada Home y reproducción PC · 30/10/2026

La captura del operador muestra /index-v117 y el modal local (botón Cerrar), sin la navegación/reproductor de app.html. El Home no incluía la entrada al contenedor persistente que ya usan otras pantallas. Al salir de esa página se perdía su iframe local.

Se agrega entrada temprana al contenedor persistente para visitas directas a /index-v117 y /index-v117.html, en cualquier dispositivo. Se conservan ruta, consulta y fragmento como view; si ya está dentro de un iframe no redirige, evitando contenedores anidados y bucles, y conservando los previews de QA.

741/741 pruebas CJS aprobadas. Este cambio corrige la entrada al reproductor y la continuidad de navegación interna. No certifica audio al minimizar Windows ni diagnostica suspensiones del navegador. Sin cambios de Worker ni producción.
