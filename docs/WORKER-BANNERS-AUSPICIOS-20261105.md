# Worker de banners y auspicios — 2026-11-05
Destino exclusivo: uadav-api-staging.uadavstream.workers.dev. No producción.
Paquete completo: releases/worker-UADAVSTREAM-V11.7-11770-banners-auspicios-20261105.js
SHA256:16699ed2c835dadd2e8eb82e5be59355df628903bb6598bd87b6bc763d207a28.
Nuevos campos de campaña: creative_title, creative_image_url, creative_target_url, banner_slot(top/infeed/footer), section_id. HTTPS sin credenciales; texto limitado y sin HTML ejecutable. Validación de creatividades antes de activar. API pública proyecta solo campos publicitarios seguros y mantiene el filtro territorial, de pago y fecha existente. No notas privadas ni importes.
GET /api/advertising/policy debe informar creative_version=2026-11-05-creative-1 después de desplegar. Sin nuevas variables, credenciales ni migraciones. Conservar bindings y valores del Worker staging actual.
29 pruebas seleccionadas aprobadas: helper nuevo, correo Cartelera, publicación atómica y vencimiento Bolsa; sintaxis de módulo validada.865 pruebas de Pages asociadas aprobadas.
Código preparado, no desplegado por esta operación. No se activaron campañas nuevas. La prueba visual de banners/auspicios queda pendiente del despliegue.
