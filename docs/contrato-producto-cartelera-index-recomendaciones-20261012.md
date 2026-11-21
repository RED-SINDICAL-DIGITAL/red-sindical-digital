# ★ UADAV STREAM — Contrato funcional de catálogo, portada y monetización
Fecha: 2026-10-12 · Estado: especificación, no funcionalidad desplegada

## Cartelera pública
- Formulario accesible a cualquier visitante, sin exigir afiliación sindical ni suscripción.
- Modalidad gratuita: publicación AUTOMÁTICA e inmediata tras validaciones técnicas básicas (campos, enlaces, antispam), sin aprobación editorial previa. El administrador puede revisar después, ocultar o eliminar. No convertir una solicitud gratuita en compra obligatoria.
- Modalidad destacada: el usuario elige ubicación (hero, portada, feed), duración y territorio. Crear orden con importe verificable. La publicación gratuita permanece visible mientras el destacado está pendiente. Transferencia con comprobante queda pendiente de verificación humana inicialmente; cuando exista conciliación bancaria confiable, activación automática al acreditar. Nunca asumir pago por subir comprobante.
- Transferencias: registrar comprobante, validar acreditación por administración o conciliación bancaria autorizada, y activar después de verificar. Objetivo operativo: resolución dentro de 24 horas; alertas por pendientes.
- Distinguir eventos cargados por organizadores de agenda externa con fuente. No presentar un evento externo como cliente publicitario.

## Editor del inicio desde admin
- Administrar secciones: crear, editar título, habilitar/ocultar, ordenar con arrastrar y soltar, asignar fuente, cantidad de elementos y diseño responsive. Secciones manuales, automáticas o híbridas, sin tocar código.
- Tipos: tendencias, novedades, géneros musicales, disciplinas, cartelera, artistas, radio, en vivo y selección editorial.
- Géneros y disciplinas editables (nombre, slug, orden, icono, imagen, visibilidad). Evitar categorías rígidas en HTML.
- Vista previa antes de publicar, control de permisos y reversión de configuración.

## Descubrimiento y recomendaciones
- Resultados de búsqueda externos no equivalen a artistas registrados. Perfil reclamado y verificado mantiene identidad propia.
- Clasificación múltiple por disciplina con corrección editorial; no inferir identidades a partir de coincidencia de nombres.
- Recomendaciones inicialmente por categorías, popularidad y contenido visto con consentimiento; permitir desactivar y borrar preferencias. Admin puede fijar recomendaciones editoriales y prioridades, con separación clara entre promoción paga y recomendación orgánica.
- No guardar indiscriminadamente búsquedas personales ni usar datos privados para publicidad sin base adecuada.

## Calidad y pruebas de aceptación
- Primera pintura del inicio y cartelera con skeleton/imagen de respaldo; carga diferida de sliders, imágenes proporcionadas y controles táctiles.
- Formularios públicos, pagos, panel y vistas en escritorio, móvil, tablet y Smart TV.
- Importaciones de trabajos y eventos: revisión previa, enlaces específicos, deduplicación y etiquetas de origen.
- Mantener manual interno y público alineados al estado efectivamente desplegado.

## Implementación
Este documento registra requisitos acordados. No declara terminados el editor, motor de recomendaciones, cobros, personalización ni controles de calidad.

## Reglas adicionales confirmadas
- Bolsa de Trabajo: publicación pública gratuita AUTOMÁTICA de ofertas válidas, sin moderación editorial previa; el administrador revisa y puede retirar posteriormente. Las ofertas importadas desde terceros son distintas: requieren curaduría antes de activarse.
- Productoras con convenios: permisos comerciales configurables por empresa, alcance territorial, vigencia, cupos y ubicaciones de destacado, con trazabilidad; no implica saltar la verificación de pagos ajenos al convenio.
- Perfiles: dos tipos principales de cuenta, espectador y artista. Un espectador puede descubrir, seguir y guardar; un artista puede reclamar/verificar y administrar su perfil, multimedia y datos. Identidad de artista descubierta no equivale a cuenta verificada.
- Taxonomía: más de 73 disciplinas de variedades, multietiqueta, jerarquía editable y orden configurable desde Admin; no limitar a música.
- Home: respetar las colecciones ya gestionadas desde Admin/KV, señales, radio y módulos existentes; evitar duplicados o reescritura destructiva. Tendencias automáticas y curaduría editorial pueden convivir, con opciones de fijar, priorizar y ocultar contenidos.
- Pagos: objetivo de revisión dentro de 24 horas para transferencias; la publicación gratuita no se retrasa mientras se verifica el destaque.
- Manual público e interno deben reflejar estas reglas cuando estén efectivamente implementadas.
