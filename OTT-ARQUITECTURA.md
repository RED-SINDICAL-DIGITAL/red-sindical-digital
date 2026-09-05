# UADAVSTREAM — Arquitectura OTT V2

## Objetivo
Construir una plataforma OTT con experiencia tipo Netflix/Teatrix, sin registro obligatorio para espectadores.

## Acceso
El espectador utilizará un **código de acceso** emitido por administración. El backend validará el código y entregará una sesión/token. No se requiere correo ni contraseña para el consumo normal.

El perfil asociado al acceso permitirá:
- favoritos;
- historial;
- continuar viendo;
- mi lista;
- preferencias básicas.

## Fuentes de contenido
El frontend no debe depender directamente de una fuente concreta. El Worker actuará como router:

`UADAVSTREAM → Cloudflare Worker → API propia / Invidious / contenido propio`

La API propia seguirá siendo el cerebro del sistema: usuarios/accesos, perfiles, favoritos, historial, eventos, artistas, radios, configuración y administración.

Invidious será una fuente complementaria para búsqueda/metadatos de contenido público de YouTube. Inicialmente se podrá probar con una instancia pública; producción no deberá depender de una sola instancia pública.

## Modelo unificado
Todo contenido se normaliza a:

- `id`
- `title`
- `description`
- `thumbnail`
- `duration`
- `url`
- `type`
- `category`
- `source`

Fuentes previstas: `api`, `invidious`, `youtube`, `mp4`, `m3u8`, `radio`, y futuras fuentes.

## Eventos
Separar completamente administración y consumo:

`ADMIN → pending → aprobar → published`

`APP → solamente eventos publicados`

## Fases
1. Acceso por código + sesión.
2. Perfil/favoritos/historial/continuar viendo.
3. Catálogo unificado.
4. API propia + Invidious.
5. Eventos publicados.
6. Reproductor universal.
7. Experiencia OTT final.
8. Evaluar VPS/Invidious propio únicamente cuando el tráfico lo justifique.

## Regla de producción
No se reemplaza `main` hasta validar cada fase en una rama de trabajo.
