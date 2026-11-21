# Postimages en Cartelera

Primera fase: acceso externo desde publicar-evento.html, sin abandonar la pestaña del formulario. El usuario sube el afiche, copia Enlace directo y lo pega en poster o cover. Se rechazan las páginas del proveedor como imagen; se conserva compatibilidad con otros alojamientos.

Las imágenes se alojan en Postimages; UADAV conserva sus URL. No hay carga automática, API key, proxy ni copia del archivo en Cloudflare. No hay garantía de conservación del formulario tras cerrar o recargar la pestaña.

El proveedor publica 32 MB por imagen, hotlinks hasta 1280 px y 1.000 unidades API mensuales en el plan gratuito. No equiparar unidades con imágenes sin documentación. Su FAQ no impone límite estricto de cantidad pero prevé revisión ante consumo elevado.

Pendiente: acceso y documentación oficial de https://api.postimages.org/, definición de unidades y límites, prueba real en celular, y recién entonces evaluar carga integrada con clave protegida en Worker y control de abuso. No usar endpoints internos del sitio para eludir la API.

Fuentes: https://postimages.org/ ; https://postimages.org/faq ; https://postimages.org/plugins
