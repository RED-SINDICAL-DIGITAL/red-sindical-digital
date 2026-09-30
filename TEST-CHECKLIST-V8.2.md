# Checklist V8.2

## Worker / D1
- [ ] `/api/health` devuelve V8.2.0
- [ ] Admin D1 muestra `ready:true`
- [ ] aparecen tablas `artists`, `events`, `radios`, `jobs`, `content_items`
- [ ] Migrar KV→D1 termina sin 405 ni error PRAGMA

## Admin
- [ ] guardar/editar Radio
- [ ] crear/editar oportunidad de Bolsa
- [ ] crear evento normal
- [ ] crear evento solicitando destaque
- [ ] confirmar destaque pago
- [ ] Prospección devuelve candidatos
- [ ] Guardar prospecto → aparece en Artistas → Prospectos
- [ ] Crear perfil desde prospecto → queda oculto/revisable
- [ ] Exportar perfiles completos XLSX

## Público
- [ ] Index abre sin 404 `/api/youtube/search` falsos
- [ ] primera pantalla carga antes que Descubrimiento
- [ ] Artista abre su perfil por ID
- [ ] Cartelera muestra eventos
- [ ] Slider En foco navega destacados pagos
- [ ] Evento abre detalle y funciones
- [ ] Radio reproduce y actualiza metadata cuando la fuente la ofrece
- [ ] Móvil: navegación inferior no tapa player ni contenido

## Invidious / YouTube
- [ ] Probar Invidious desde Admin
- [ ] diagnóstico indica Invidious primero
- [ ] YouTube API aparece habilitada como último fallback
