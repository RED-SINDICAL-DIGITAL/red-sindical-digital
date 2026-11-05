# Entrega comercial QA real — 2026-11-04
Solo staging. Campaña CAMP-MW2RMB99-P5TLU reutilizada, entidad cambiada al evento explícitamente ficticio EV-MVF91D41. Combo Hero+Cartelera, bonificada sin pago real. Activación temporal con delivery_verified para medir la integración; no acredita campaña comercial de cliente.
## Evidencia
- Alcance internacional temporal: navegador mostró PUBLICIDAD · DESTACADO y evento ficticio en premiumRail de Cartelera; Hero de Cartelera mostró PUBLICIDAD. Hero de Explorar mostró la campaña como diapositiva2de3, manteniendo institucional y editorial.
- Alcance provincia SantaFe/AR: consultas públicas con country/province explícitos devolvieron campaña para SantaFe y [] para Córdoba, HTTP200.
- Alcance nacional/AR: mismas consultas devolvieron campaña para ambas provincias, HTTP200.
- Fechas cambiadas a 2026-11-02/2026-11-03: API devolvió []HTTP200 y Cartelera recién abierta mostró No hay eventos destacados con estos filtros.
- Estado final confirmado en Admin: paused; delivery_verified=false; bonificada; notas QA y fechas pasadas conservadas. No cobros, correos ni producción modificados.
## Límites
Consultas territoriales verifican filtrado real del endpoint con parámetros explícitos, no ubicación física de dos usuarios ni exactitud de geolocalización Cloudflare. Retirada comprobada al abrir otra vez la página; no prueba retirada en una pestaña que permanece abierta ni invocación de cron. Banners/radios/auspicios y pagos reales siguen fuera de esta evidencia.
