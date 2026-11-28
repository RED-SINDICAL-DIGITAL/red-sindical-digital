# UADAV Stream · Cuenta única y recuperación simple por correo

Fecha: 28/11/2026 · PR #74, **sin permiso para publicar producción**.

## Regla de producto

Una persona tiene **una cuenta**, no una por dispositivo. Entra con un enlace enviado a su correo, sin contraseñas ni códigos manuales. El correo **verificado y asociado a la cuenta original** permite volver a abrir *esa misma cuenta* desde un teléfono o computadora nuevos. Conocer un email de contacto público no demuestra titularidad de un artista. No se transfieren artistas ni información de terceros automáticamente.

La experiencia visible debe poder entenderla una persona sin conocimientos digitales: **Entrar con mi correo**, **Revisar mi correo**, **Abrir mi perfil**. Las opciones especiales quedan dentro de **Ayuda / Recuperar acceso**, no en la pantalla principal.

## Hallazgos comprobados en el repositorio

- `uadav-account-email.js` distingue un equipo con cuenta original (modo `verify`) de un equipo nuevo (modo `access`); invoca `/api/access/email/verify`, `request` y `redeem`. Un enlace válido de un solo uso registra el nuevo dispositivo.
- En `worker.js`, `/api/access/email/status` puede devolver `identity` cuando se presenta la autenticación de la cuenta. La recuperación del usuario se decide en el backend, no por coincidencia del correo visible.
- `uadav-account-sync.js` sincroniza las claves actuales de usuario, favoritos, ver más tarde, playlists, artistas seguidos, radios e historial usando la cuenta autenticada. No se deben crear claves alternativas o duplicar colecciones.
- Los vínculos artísticos se consultan en `GET /api/account/artists` por identidad de cuenta. `POST /api/account/artist-session` devuelve 403 a otras cuentas en los tests aislados.
- La API `/api/account/notifications` reúne avisos de cuenta, estado de reclamos artísticos, anuncios y notificaciones vinculadas con artistas administrados; la consulta de `artist_inquiry` depende de la titularidad vigente del artista. **Estas notificaciones/consultas no están demostradas como parte de la colección de sincronización del perfil personal**. Verificar su persistencia y origen con un nuevo dispositivo antes de afirmar que «se recupera todo».

## Flujos de uso mínimos

1. **Primera vez:** «Entrar con mi correo» → ingresar dirección → recibir enlace → abrir → Mi Perfil. Debe quedar claro si se creó una cuenta nueva.
2. **Ya tenía perfil en este equipo:** «Configurar o usar mi correo» → verificar **desde la sesión de la cuenta actual** → confirmar enlace → la cuenta conserva el mismo identificador y todos sus vínculos. Sin un email verificado no prometer recuperación completa al perder el dispositivo.
3. **Cambio o pérdida de teléfono:** correo ya verificado → recibir enlace → entrar desde el nuevo equipo → **mismo account_id**; foto y perfil; biblioteca; artista/s gestionado/s; trabajos, eventos, solicitudes, notificaciones e historial de mensajes donde corresponda. No pedir QR ni código de emparejamiento como flujo habitual.
4. **Artista existente sin email verificado:** mostrar «Para recuperar este perfil, primero verificá el correo desde el equipo donde ya lo usás». Si perdió todos los equipos, ofrecer recuperación supervisada de titularidad; **no** entregar un artista solo por correo público, nombre o enlace no verificado.
5. **Cambio de correo:** confirmar desde cuenta ya autenticada y verificar dirección nueva; evitar que una solicitud desde un dispositivo ajeno desplace a la cuenta original.
6. **Soporte y notificaciones:** un buzón interno entendible para mensajes administrativos, consultas/contrataciones, postulaciones y avisos relacionados con su cuenta. Mostrar procedencia, estado y acción principal; mantener historial y privacidad sin exponer contenido entre cuentas.

## Gates antes de producción

- [x] En staging: segundo Gmail recibió enlace e inició sesión; `GET /api/account/artists` autenticado devolvió 200, 0 artistas y 0 solicitudes ajenas.
- [x] En pruebas Worker + SQLite aisladas: un usuario no propietario recibe 403 al intentar una sesión de artista ajeno.
- [x] Se restauró deployment previo de Pages staging `0ef5cd49-0d2f-4602-ac7b-6487803b18cd`.
- [ ] **Prueba extremo a extremo de recuperación de LA MISMA cuenta:** verificar email en la cuenta original, abrir desde otro dispositivo, comparar identificador privado de cuenta sin exponerlo en capturas, y comprobar artista y las siete colecciones.
- [ ] Comprobar persistencia y aislamiento de *consultas, contrataciones, postulaciones, mensajes internos y notificaciones* tras recuperación. Distinguir datos de cuenta y datos ligados a artista; evitar pérdida al transferir titularidad.
- [ ] Contratos de reenvío, enlace vencido/ya usado, cambio de correo, cuenta borrada, dispositivo revocado, bloqueo de duplicación e identidad ajena.
- [ ] QA visual y accesible en móvil 320/390 px, PC y TV; botones ≥44 px, íconos coherentes, foco/lectores de pantalla, una acción principal por pantalla, sin formularios técnicos.
- [ ] Confirmar SHA de frontend y Worker productivos frente al código; no publicar si difieren sin revisión y rollback definido.

**No confundir:** inicio de sesión por segundo Gmail, confirmación de email de una cuenta existente y recuperación de sus vínculos son **tres pruebas distintas**. Ninguna autorización permite fusionar cuentas automáticamente ni modificar producción, Worker, D1, KV o secretos.
