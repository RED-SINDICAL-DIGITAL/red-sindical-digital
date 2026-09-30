# Deploy V8.4

1. No crear otra D1. Mantener `DB -> uadavstream` y `UADAV_DB -> KV actual`.
2. Subir primero `worker.js`.
3. Verificar `/api/health` => `V8.4.0`.
4. Admin -> D1, IA y automatización -> `Reparar / inicializar D1`.
5. Reemplazar `admin.html`.
6. Probar: Artistas -> reparar/enriquecer; Importar/exportar; Radios; Cartelera; Monetización.
7. Subir assets compartidos `uadav-ui-v8.4.css`, `uadav-ui-v8.4.js`, plantillas XLSX y `manual.html`.
8. Subir frontend público.
9. Subir `app.html`, `manifest.json` y `service-worker.js` al final.

## Prueba mínima
- Importar plantilla Seccional en modo Artistas.
- Importar plantilla completa con `Todo / detectar hojas`.
- Crear/importar radio y comprobar volumen/mute/stop.
- Abrir tarjeta de radio desde Home y reproducir desde Quick View.
- Probar App Shell: reproducir radio, navegar a Artista/Cartelera y confirmar continuidad.
- Abrir un video dentro del perfil artista sin salir de UADAV STREAM.
- Abrir placa completa de un evento destacado.
- Probar Shorts con mouse/touch y móvil.
