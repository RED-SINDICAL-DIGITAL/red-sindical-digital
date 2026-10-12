# Auditoría transversal de experiencia ★ UADAV STREAM
Fecha: 2026-10-12. Estado: revisión documental de código, no pruebas funcionales ni despliegue.

## Principios heredados
- Mantener Cloudflare Workers/KV/D1 + GitHub/PWA y shell/reproductor persistente; no duplicar menús ni construir otro backend.
- No alojar películas ni transmisiones; usar URLs de proveedores permitidos y contenido autorizado. Preservar fallback de búsqueda y funcionamiento PC/móvil/tablet/TV.
- Plataforma abierta al público, con usuario espectador opcional y artista que reclama/verifica y gestiona su perfil. Afiliación sindical no condiciona el acceso público.
- Configuración desde Admin: menú, categorías, secciones, orden, visibilidad, portada, destacados, contenidos y convenios; distinguir configuración implementada de la pendiente.

## Hallazgos de archivos revisados
| Archivo | Tamaño aproximado | Observación |
|---|---:|---|
| index.html | 1,3 KB | Entrada/redirección; no es el home visual principal |
| app.html | 33 KB | Shell y menú con rutas escritas en HTML; falta verificar edición desde Admin |
| index-v117.html | 28 KB | Home con hero y reproductor; auditar fuentes de secciones y carga progresiva |
| admin.html | 250 KB | Ya incluye gestión de secciones/layout/colecciones y módulos de radio, live, publicidad y monetización |
| radio.html | 47 KB | Tiene referencias a chat, hero y favoritos; rediseño visual y QA pendientes |
| artistas.html | 10 KB | Revisar búsqueda, perfil descubierto, reclamo, clasificación multietiqueta y reproducción |
| cartelera.html | 22 KB | Hero existente; mejorar carga progresiva y slider sin deformación |
| en-vivo.html | 9,5 KB | Revisar feed vertical móvil, directos, IPTV, TV y chat; no presumir que están completos |
| bolsa-trabajo.html | 17 KB | Formularios y seguimiento en desarrollo; validar publicación automática y postulaciones |

## Reglas por sección
1. **Inicio**: hero rotativo, carruseles táctiles y de ratón, secciones manuales/automáticas/híbridas; editor de orden, títulos, estilos y géneros desde Admin. Curaduría editorial + recomendaciones con privacidad y sin confundir publicidad.
2. **Explorar y búsqueda**: búsqueda universal sin límite artificial de pocos resultados, página de resultados independiente, sugerencias, filtros y categorías; click reproduce o abre ficha; nunca duplicar header.
3. **Artistas**: descubrimiento externo no es registro ni verificación; ficha cinematográfica con contenidos; reclamo privado, acceso duradero y gestión de perfil; más de 73 disciplinas, etiquetas múltiples y corrección editorial.
4. **Radio**: rediseñar ficha de emisora estilo Spotify/YouTube Music, portada grande, logo, metadatos en vivo, carátulas cuando existan, chat, compartir, seguir/favoritos, volumen, controles, programación e historial; audio persistente entre páginas, recuperación tras bloqueo de autoplay. Importar/exportar emisoras vía CSV/Excel.
5. **En vivo**: feed 9:16 móvil tipo Shorts/Reels/TikTok para artistas, actuaciones, flyers y directos; deslizar, pausar/reproducir, compartir, abrir perfil y cartelera; señales TV/IPTV/HLS autorizadas, radio y directos externos, detección de emisión cuando sea viable; vista adaptada para TV/PC, chat donde esté permitido.
6. **Cartelera**: publicación gratuita pública inmediata, controles técnicos antispam y revisión posterior; destacados pagos con verificación o convenio, agenda externa etiquetada; slider con respaldo instantáneo, proporciones correctas y tiempo uniforme; filtros territoriales y calendario.
7. **Bolsa de trabajo**: publicar ofertas y postularse libremente; seguimiento privado; ofertas externas curadas antes de publicar, importación por URL/CSV/Excel, deduplicación y limpieza selectiva de antiguas importaciones.
8. **Cine, series, teatro y espectáculos**: categorías del catálogo de artistas de variedades, temporadas y episodios cuando correspondan, reproducción mediante proveedores externos autorizados, fichas completas y navegación unificada.
9. **Comercial y publicidad**: tres ubicaciones comerciales acordadas (Inicio, Cartelera, Explorar); segmentación geográfica, orden y comprobante, activación tras verificación, convenio configurable; sin comisión de intermediación impuesta a contrataciones artísticas.
10. **Admin**: controles sin editar HTML, vista previa, gestión editorial, publicaciones, ofertas, artistas, fuentes, radio, eventos, publicidad y métricas; manual interno y público por función.

## Próximos pasos técnicos
- Revisar primero radio.html y su relación con el shell y el player global; generar una propuesta de rediseño sin reemplazar código funcional.
- Auditar endpoints de configuración de navegación, home_layout y secciones existentes antes de implementar controles adicionales.
- Ejecutar QA real y CI antes de fusionar PR; los hallazgos de archivo no prueban funcionamiento en producción.
