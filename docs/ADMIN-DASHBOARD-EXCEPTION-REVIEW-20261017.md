# Excepciones del resumen y acceso directo — 17/10/2026

Fallo reproducido en Chrome de staging: Revisar sobre el reclamo QA DEMO PERFIL 1700 en Centro de excepciones abría Artistas en Catálogo, sin seleccionar el reclamo. Se conecta el aviso con UADAVOpenPendingClaim usando el id de la excepción y la resolución fresca por identificador ya existente. Revisar no aprueba, publica ni activa PRO. Otros tipos conservan navegación a su sección; destinos desconocidos regresan al resumen. Una acción de un resumen que ya no está activo no abre otro registro.

Se agrega control de navigationId y sección a VIEWS.dashboard tras esperar sus cargas: una respuesta antigua no puede reemplazar la sección posterior. Cinco regresiones nuevas sobre acceso exacto, compatibilidad, registros ausentes/contexto obsoleto, destino desconocido y carrera de carga.

Validación local: 27 pruebas de navegación/acceso directo satisfactorias; conjunto de moderación, solicitudes, guardado, consultas y búsqueda: 65 satisfactorias. GitHub Actions sobre 894275375130f96a1b26b13318d2cfd178c2e602: Platform integration checks 39077982631 y Job status contract checks 39077982609 satisfactorios.

Validación real tras recargar Admin en staging: la sesión se restablece; desde Visión general, Revisar QA DEMO PERFIL 1700 abre Verificación de reclamo con artist_id ART-266d08434699460d82fd6b042a47df23 y nombre correcto. Cerrado sin aprobar/rechazar; continúa Pendiente y hay 10 solicitudes. El resumen muestra 14 pendientes (10 accesos + 3 moderaciones + 1 consulta); Pendientes carga 14. El filtro Consultas deja 1 visible; Revisar abre la referencia CON-0fe1652283a3a3f956ec9b876559acdb0d16b77b552f29bb25a30bb36ece4852 para QA PRO INTEGRAL 1510, estado Nueva, sin cambiarlo. Evidencia visual guardada durante la revisión.

No se desplegó producción ni se alteraron registros, accesos, pagos o secretos. Continúa bloqueada la vinculación privada de la cuenta por revisión automática del formulario seguro; no se intentó un acceso alternativo. Pendiente la validación física en móvil/tablet/TV y del propietario autenticado.
