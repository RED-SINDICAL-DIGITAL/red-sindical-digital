# Radio Studio: Admin y Mi perfil — 18/10/2026

## Añadido a la rama
Admin > Radios > Operadores abre la gestión de accesos para las emisoras existentes. Busca cuentas por nombre, exige selección explícita, verificación y motivo de al menos 10 caracteres. Muestra cuentas habilitadas/revocadas, permite confirmar una revocación y bloquea controles durante la operación. No concede permisos al cargar o buscar.
Se exporta renderRadios para que los botones inline del listado y volver funcionen desde su contexto real.

Mi perfil incorpora una entrada Mi radio > Abrir Radio Studio sólo tras una respuesta autenticada con emisoras autorizadas. Cuenta ausente, backend no desplegado o sin permisos dejan la entrada oculta. Cambio de cuenta limpia la entrada y descarta respuestas pendientes.

Módulos:
- uadav-radio-operators-admin.js
- uadav-radio-studio-entry.js

## Validación
15 pruebas de interfaz en total: 5 Studio, 5 Admin y 5 entrada de perfil. Concesiones/revocaciones sólo simuladas en VM. Integración aislada del Worker previa cubre permisos entre dos cuentas/emisoras. Sintaxis módulos correcta.
No se hizo ninguna concesión o revocación real. No se ingresó al Admin con credenciales ni se probó todavía el recorrido visual completo autenticado de estas incorporaciones.

## Cierre pendiente
Desplegar Worker de staging validado y repetir Admin → permiso de cuenta de prueba verificada → Mi perfil → Studio → pedido → estado → revocación. La actualización Pages no despliega el Worker.
Operador puede gestionar estados; chat/respuestas del operador y conciliación D1/KV siguen pendientes. No se declara Radio Studio completo o listo para producción. Permisos reales requieren confirmación del responsable en el momento de habilitarlos.
