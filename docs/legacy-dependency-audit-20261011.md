# Auditoría de dependencias y limpieza gradual

## Evidencia verificada

- `index.html` carga `app.html`; `app.html` referencia `index-v117.html` y este último enlaza nuevamente a `app.html`. **No eliminar ninguna de estas páginas** sin revisar el flujo de navegación.
- `mi-perfil.html` y `mi-uadavstream.html` son accesos de compatibilidad hacia `usuario.html`.
- `usuario.html`, `mi-espacio-artista.html` y `gestionar-artista.html` cargan `uadav-artist-account-v142.js`.
- `artista.html` todavía utiliza `uadav-content-player-v928.js`.
- `app.html` utiliza `uadav-playlist-player-v136.js`.
- En las diez páginas principales inspeccionadas no aparecen referencias a `uadav-artist-account-v129.js`, `uadav-artist-account-v132.js`, `uadav-playlist-player-v134.js` o `uadav-playlist-player-v135.js`. **Esto no demuestra que estén sin uso**: podrían ser importados por otros scripts, documentos o integraciones.

## Política de limpieza

1. No borrar un archivo por su sufijo de versión.
2. Inventariar referencias en HTML, JS, service workers, configuración de despliegue y enlaces públicos antes de eliminar.
3. Verificar navegación desde inicio, perfil, artistas, cartelera, trabajo y reproductor en móvil y PC.
4. Eliminar solo cuando las referencias sean cero y exista un reemplazo probado; preferir primero retirar la carga de scripts duplicados.
5. Mantener las rutas públicas de compatibilidad mientras puedan existir enlaces externos.

## Próxima auditoría funcional

- Usuario y artista: misma identidad, cambio de cuenta, restauración, revocación.
- Free y PRO: vigencia, beneficios y verificación del lado del servidor.
- Admin: autorización por rol y moderación.
- Cartelera y bolsa: propiedad de eventos, publicación, destacados y acceso público.
- Multimedia: número de peticiones hasta el primer cuadro, reintentos, fallback y caché.

**Estado:** análisis parcial; ninguna eliminación de producción autorizada por esta nota.
