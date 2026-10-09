# Recuperación de artista · Worker 11743 / web 12038

Se verificó que producción estaba en 11742. El despliegue de la web 12037 había finalizado correctamente.

Se encontró un defecto distinto del cierre periódico del formulario: POST /api/artista/access/create, usado por Admin, generaba un permiso sin claim_id para cualquier artista. Si existía un propietario activo, el permiso era rechazado por las rutas privadas y por la vinculación de cuenta. No se ha leído aún la respuesta JSON del 403 concreto del usuario; este defecto sí se reprodujo en pruebas.

11743 genera el nuevo acceso con el claim_id del propietario vigente. Si un perfil reclamado no tiene un registro coherente de propiedad, se detiene con una explicación; no se otorga acceso a otro dueño. La emisión sólo está disponible para Admin autenticado y queda auditada.

Los enlaces antiguos que carecen del dato de propiedad no se convierten automáticamente en permisos de propietario. Deben regenerarse después de desplegar 11743. Admin comprueba la versión del servidor antes de generar el enlace.

Recorrido de reparación:
1. Desplegar releases/worker-UADAVSTREAM-V11.7-11743.js conservando bindings y secretos.
2. Verificar /api/health: build 11743.
3. Actualizar Admin, entrar a Artistas y generar un acceso privado para el artista afectado.
4. Abrir ese nuevo enlace desde el dispositivo con la cuenta que utilizará el artista, o pegarlo en Mi perfil → Vincular mi artista.
5. Si pertenece a otra cuenta, vincular el dispositivo a esa cuenta mediante QR. Un pago no transfiere propiedad.

La web 12038 muestra el formulario abierto y conserva el texto durante las sincronizaciones. Incluye información del método, estado HTTP y código del error sin mostrar claves ni tokens. El estado del formulario no cambia por una repetición del mismo error. Un acceso rechazado no se reenvía automáticamente cada 15 segundos; Volver a comprobar permite un reintento explícito.

Diseño: espacio de artista junto a la cuenta, panel ancho con formulario limitado, botones táctiles, márgenes y avatar compactos, sin repetición de marca dentro del perfil. Mantiene biblioteca, historial e intereses.

Pruebas con SQLite real: el acceso generado por Admin incluye al propietario y permite vinculación; aislamiento entre cuentas, revocación y transferencia de propiedad continúan aplicándose. Pruebas del formulario, navegación y consultas de Admin, pagos y entrada del inicio pasaron. La comprobación bancaria real sigue pendiente de integración.
