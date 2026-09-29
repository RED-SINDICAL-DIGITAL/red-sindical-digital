# Checklist V7.4.2

- [ ] `/api/health` devuelve HTTP 200 y versión V7.4.2.
- [ ] Admin sin clave no dispara 401 de D1/prospección.
- [ ] Login Admin correcto.
- [ ] `Estado D1` responde tras login.
- [ ] `Inicializar D1` funciona una sola vez y es idempotente.
- [ ] Cartelera abre aunque D1 no esté inicializada.
- [ ] Guardar configuración no devuelve 401.
- [ ] Artistas, radios, señales y secciones cargan en Admin.
- [ ] Invidious health muestra al menos una instancia cuando la red lo permite.
- [ ] Búsqueda usa `cache`/`invidious` antes de `youtube_api`.
- [ ] Player de radio no aparece al final del Index antes de reproducir.
- [ ] Player de radio aparece como dock al iniciar una emisora.
- [ ] Vista móvil: Admin sin superposición y Home sin overflow horizontal.
