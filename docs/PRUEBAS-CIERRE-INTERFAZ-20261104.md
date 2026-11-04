# Verificación ampliada de interfaz — 2026-11-04
Solo staging. 848/848 pruebas aprobadas, cero fallos.
Se reemplazó la expectativa obsoleta del botón “Elegir mi PRO” por una prueba ejecutable: el cargador histórico no realiza solicitudes si la vista vigente de Promoción no contiene un cuadro de órdenes. Las pruebas existentes de retiro comercial siguen verificando ausencia de checkout en la vista pública y Admin. Se conservan pruebas históricas de órdenes y protección frente a respuestas tardías.
No se reactivaron membresías, cobros o permisos. Sin cambios de aplicación, Worker, datos ni producción en esta pasada.
