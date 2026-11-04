# Cierre de guardado y cola · 4/11/2026

## Correcciones
- Favoritos, ver más tarde y Biblioteca identifican el mismo video de YouTube aunque su ID interno de catálogo o su formato de enlace difieran.
- Quitar un favorito elimina todas las copias de esa identidad, conservando el resto.
- Al guardar desde una cola se excluyen campos transitorios __uadav*: no se anida la lista completa dentro de cada favorito, historial o playlist. La instantánea completa sigue disponible para recuperar la reproducción en sesión.
- Al cambiar de elemento en la cola se actualizan los botones de Favorito y Más tarde.

## Evidencia
Pages: 771/771 pruebas aprobadas. Worker: 453/453, sin cambios de código. La pasada anterior verificó dos elementos cargados, avance manual y persistencia del reproductor al navegar. El fin automático se comprobó en pruebas del controlador; no certifica audio real ni sincronización entre dispositivos.

## Bloqueo concreto para completar el cierre
Admin staging solicita Clave Admin; se prepara autenticación mediante formulario seguro del chat. Sin autenticar no se certifican recuperación HTTP de Bolsa, recepción/canje real, vencimiento remoto de destacados ni revisión privada de Admin. Recuperación pública de ofertas permanece sin habilitar por esta pasada. No se modifican variables, cron, D1 ni producción.

Prioridad siguiente: verificar estado real de la QA privada existente antes de crear nuevos datos o reenviar correos. No reiterar envíos inciertos. No activar recuperación pública ni pagos reales para dar por cerrada una prueba.
