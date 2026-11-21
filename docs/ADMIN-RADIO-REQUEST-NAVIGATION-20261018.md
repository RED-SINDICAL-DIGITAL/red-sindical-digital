# Admin Radio: navegación y estados — 18/10/2026

## Visual real
Se recargó Admin autenticado en staging y se abrió Operadores. Los campos Emisora y búsqueda ya muestran el estilo oscuro, anchuras y bordes nuevos. El botón de búsqueda conservaba estilo nativo: se completó su CSS en un commit posterior, pendiente de nueva verificación visual. No se concedieron o revocaron permisos.

## Corrección
setRadioRequest antes actualizaba el pedido y ejecutaba go(radios,true), incluso si el usuario había cambiado de sección. Ahora:
- Captura ID y navegación al comenzar; bloquea otra escritura del mismo ID.
- Confirma success=true antes de cambiar el estado en caché.
- No navega ni repinta otra sección cuando llega una respuesta tardía.
- Restaura botones y conserva el estado ante error.
- Mantiene deshabilitados otros pedidos con escritura pendiente si se reconstruye la tabla.

4 pruebas del controlador y 42 regresiones de artistas, pendientes y moderación satisfactorias: 46 en total. Nuevas pruebas incorporadas a GitHub Actions.
No había pedidos reales en la bandeja de staging; no se afirma probado un cambio remoto de estado desde la interfaz. Este incremento sólo modifica frontend; no requiere otro despliegue Worker.

## Siguiente cierre
Se necesita una cuenta de operador autenticada y permiso confirmado explícitamente para completar Admin → Mi perfil → Studio → pedido/chat → revocación. Las pruebas aisladas y lectura del Admin no sustituyen ese circuito. Producción y pagos sin cambios.
