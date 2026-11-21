# Banner y auspicio: conexión pública — 2026-11-05
Solo staging. Admin edita nombre visible, imagen, enlace HTTPS, uno de tres espacios y sección auspiciada. Para guardar campañas infeed/section_sponsor exige creative_version=2026-11-05-creative-1 del Worker; sin ese despliegue falla con instrucción clara y no descarta silenciosamente datos.
Banner público reusa UADAVHomeBanners: sobrescribe únicamente el espacio elegido y recupera configuración base al retirarse. Auspicio añade enlace identificado PUBLICIDAD al encabezado de sección existente con data-admin-section exacto; no crea sección ni cuarto banner. Texto mediante textContent, enlace sin credenciales y sin HTML arbitrario.
Observador existente filtra fechas y refresca; excluye pares entidad/ubicación no compatibles. Hero y Cartelera mantienen sus integraciones anteriores.
865 pruebas aprobadas, incluido rechazo de esquemas, espacio adicional, credenciales y auspicio sobre sección inexistente.
Pendiente despliegue Worker88a4f6a499b19774ea4d95995b66e040d1dfcf0f y prueba visual de ambos formatos. Sin activación comercial ni cambios de producción.
