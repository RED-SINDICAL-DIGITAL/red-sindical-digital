# White-label deployment checklist

Este repositorio funciona como base reutilizable. Cada marca debe desplegarse como una instalación independiente.

## 1. Recursos por instalación
- Repositorio GitHub propio.
- Proyecto Cloudflare Pages propio.
- Worker propio.
- D1 propio.
- KV propio.
- Dominio principal y alias propios.
- Secrets/API keys propios. No copiar credenciales de otra marca.

## 2. Worker y datos
1. Crear D1 y KV en la cuenta Cloudflare de la marca.
2. Vincular los bindings que espera el Worker (DB y UADAV_DB mientras se conserva compatibilidad).
3. Configurar secrets necesarios: Admin, YouTube, IA y automatizaciones sólo si el módulo los usa.
4. Desplegar worker.js.
5. Ejecutar/validar inicialización D1 desde Admin y aplicar las migraciones versionadas.
6. Verificar /api/health y el diagnóstico D1.

Los nombres heredados UADAV_* son compatibilidad interna y se migrarán progresivamente; no implican compartir recursos entre instalaciones.

## 3. Frontend
1. Crear Pages desde el repositorio de la marca.
2. Definir PLATFORM_API_BASE apuntando al Worker propio. UADAV_API_BASE se mantiene como alias de compatibilidad.
3. Configurar desde Admin: nombre, icono, logos, favicon, dominio canónico, dominios alternativos, SEO y módulos.
4. Probar Home, búsqueda, reproducción, artistas, radio y los módulos habilitados en móvil y escritorio.

## 4. Módulos
Los módulos son configurables por instancia: Artistas, Radio, Podcast, Live/IPTV, Cartelera, Bolsa de trabajo, Marketplace, PRO y Publicidad. Los módulos sindicales/UADAV deben permanecer separados del CORE y no habilitarse en marcas que no correspondan.

## 5. SEO
- Elegir UN dominio canónico.
- Redirigir dominios alternativos al canónico mediante Cloudflare/DNS/rules.
- Verificar Google Search Console y Bing Webmaster.
- Confirmar que robots.txt, sitemap.xml y la clave IndexNow responden EN EL DOMINIO PÚBLICO. Los endpoints existentes en el Worker no garantizan por sí solos que Pages los sirva en la raíz.
- Enviar sitemap y ejecutar IndexNow desde Admin después de validar el routing.

## 6. IPTV
Importar sólo playlists/señales con autorización. El importador M3U normaliza metadatos y URLs; no debe utilizarse para eludir DRM, controles de acceso o redistribuir señales sin derechos.

## 7. Go-live
No considerar una versión desplegada porque exista un commit. Confirmar por separado:
- GitHub/Pages publicado.
- Worker desplegado.
- D1 migrada.
- KV/bindings correctos.
- configuración de marca guardada.
- prueba E2E completada.

Para una nueva marca, por ejemplo BeatPlay, repetir este procedimiento con recursos independientes; nunca reutilizar D1/KV/secrets de UADAV STREAM.
