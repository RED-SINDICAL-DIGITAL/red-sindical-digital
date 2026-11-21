# Respuestas de cuenta y renovación de sesión — 17/10/2026

## Correcciones

El cliente de cuenta distingue fallos temporales, límites de solicitudes, respuestas ilegibles y datos incompletos. Los errores conservan estado HTTP/ruta/método para soporte. Una respuesta sin lista de artistas válida ya no se interpreta como una cuenta vacía; una lista legítima vacía sigue funcionando. No se elimina la credencial de cuenta ante un fallo.

Antes de guardar una sesión se verifica que artist_id coincida con el artista solicitado y que el token tenga el formato que emite account/artist-session en el Worker actual (ART-). Una respuesta incompleta, de otro artista o recibida tras cambiar de cuenta no reemplaza el token ni el marcador previos. No se añade un mecanismo de aprobación ni se modifica la duración de las sesiones del servidor.

Los detalles técnicos del error en la tarjeta de artistas pasan a Detalles para soporte. Se actualiza la versión del módulo en Mi perfil, Gestionar artista y Mi espacio para renovar la caché de sus consumidores.

## Pruebas

35 pruebas locales satisfactorias: 8 nuevas de respuesta y persistencia segura, más identidad pública, enlaces, renovación y rutas existentes. Sintaxis del módulo satisfactoria.

Nueva integración: módulo cliente real cargado en VM → Worker real → SQLite en memoria y KV Map aislados. Se crea una cuenta y artista ficticios locales; el cliente lista al artista, valida y guarda la sesión, abre su perfil privado, recibe 403 para un artista ajeno sin perder el token guardado y, tras rechazo de la solicitud, deja de ver la vinculación y el Worker deniega el acceso anterior. La prueba no usa red externa ni credenciales reales.

CI incorpora ambas pruebas nuevas. Pendiente comprobar el resultado de GitHub Actions y los módulos servidos por Pages. No equivale a una sesión de propietario en navegador, a Cloudflare D1/KV reales ni a una prueba en dispositivos físicos. Worker, producción y pagos permanecen intactos.

## Fallo de CI detectado y resuelto localmente

La primera ejecución completa (Platform integration checks 753) falló en Artist tool session isolation antes de llegar a la integración nueva. Reproducción local: dos fixtures devolvían token sin artist_id y con formato distinto al Worker. Se actualizaron a la respuesta real (artist_id del artista solicitado + token ART válido); no se debilitó la validación de producción ni se quitaron pruebas. Se repitió el conjunto con aislamiento de herramientas: 39 pruebas satisfactorias. La integración real cliente/Worker/SQLite también había pasado, confirmando el formato del servidor.

Pendiente: ejecución completa posterior al ajuste de fixtures. No se debe informar como pasada la ejecución 753 ni sus pasos omitidos.

## Verificación final del incremento

GitHub Actions del commit cdc8bb3ecd2c6bea9623ffbb21764436061c7d1c: Platform integration checks 758 y Job status contract checks 350 satisfactorios. La ejecución completa ya incluye los fixtures corregidos y la integración nueva. Mi perfil de staging respondió HTTP 200 y su HTML referencia uadav-artist-account-v142.js?v=20261017-session-validated y contiene el botón de comprobación. Esto verifica la entrega del HTML, no el uso autenticado del módulo por un propietario en un dispositivo físico. No se requiere despliegue de Worker para estos cambios frontend.
