# Auditoría de Mi Perfil · beta staging · 2026-11-07

## Alcance
Inspección del código de `usuario.html`, `uadav-account-ui.js`, `uadav-account-sync.js`, `uadav-account-email.js`, `uadav-profile-email.js`, `uadav-jobs-account.js`, módulos de artista y pruebas de CI. No se han inspeccionado datos privados del usuario ni bases reales, ni se ha ejecutado esta auditoría en un navegador remoto conectado. Las afirmaciones de comportamiento real se limitan a las pruebas que el usuario confirma.

## Estructura actual
1. Cabecera: avatar/foto, nombre, edición personal.
2. Gestiones: trabajos, artista, biblioteca, eventos, ofertas y contacto directo.
3. Mis trabajos: elementos vinculados a cuenta, gestión de comprobantes privados y consulta puntual de una postulación.
4. Mi artista: creación/vinculación, gestión de consultas, Press Kit y herramientas (según autorización).
5. Historial reciente, biblioteca y gustos/intereses.
6. Configuración de cuenta: creación, vinculación de dispositivos, sincronización, conflictos, permisos/revocaciones, foto, borrado local y recuperación.
7. Funciones condicionadas: Radio Studio y avisos.

## Hallazgos y decisiones

### Corregidos en candidato de staging
- **Actualización de perfil inconsistente:** el script de cuenta reconstruía `user` desde JSON local sin pasar por `normalizeProfile` ni por la firma de actualización de la vista principal. Se delega ahora a `refreshProfileView`, evitando valores malformados y repintados innecesarios de estados ajenos.
- **Eventos de almacenamiento sin filtrar:** antes cualquier cambio de `localStorage` obligaba a refrescar los paneles de cuenta. Ahora se escucha solo borrado general, perfil personal y credencial de cuenta.
- **Diferencia entre cuenta personal y artista gestionado:** se explica expresamente en la sección Mi artista. No se habilita ninguna asociación sin autorización.
- **Dos flujos de Mis trabajos poco claros:** se distingue gestión vinculada a la cuenta de consulta mediante comprobante privado y el botón se llama `Consultar comprobante (.txt)`.
- **Borrado local ambiguo:** la etiqueta decía “Borrar datos de este navegador” pero el código solo elimina el perfil local y el historial reciente. Texto y confirmación ahora detallan exactamente el alcance, sin alterar el borrado implementado.

### Revisados: sin cambio funcional en esta pasada
- Identidad personal: nombre y foto se guardan localmente; la imagen se reduce a 256 px en JPEG. El guardado anuncia cambios a sincronización.
- Sincronización: gestiona revisiones y conflictos; los códigos de recuperación/identidad son distintos de los códigos de seis cifras de vinculación.
- Recuperación: el acceso mediante correo se mantiene separado del respaldo largo; el usuario confirmó que pudo recuperar por correo desde el celular.
- Biblioteca: cuenta favoritos, playlists, seguidos y radios. El historial usa tarjetas activables por teclado.
- Mis trabajos: comprobantes privados no pasan a la ficha pública por la consulta local.
- Artista: el acceso al perfil administrado exige vinculación independiente.
- Admin, ofertas y eventos se revisan en sus propios módulos, no se administran con privilegios desde el perfil público.

### Riesgos pendientes de beta (requieren QA real)
- **Dos dispositivos:** después del acceso por correo, guardar favorito e interés en un dispositivo y confirmar llegada al otro, luego repetir al revés. Confirmar resolución de conflicto y desvinculación, sin copiar tokens.
- **Permisos de artista:** comprobar desde el celular que la gestión solo aparece con una autorización real. No confundir cuenta personal verificada con artista administrado.
- **Visual móvil:** scroll, tamaño táctil, superposición del reproductor persistente y teclado con diálogos de edición / vinculación. No afirmar aprobación por revisión estática.
- **Foto:** subir JPEG, PNG y WebP en dispositivo real, luego sincronizar y verificar visualización en el otro. Observar fallos de almacenamiento por cuota.
- **Rendimiento:** medir apertura y carga de las secciones; las demoras no pueden atribuirse solamente a la conexión de Internet sin datos.
- **Correo:** comprobar accesibilidad de enlace y reversión de estados; el `/api/health` mostró `brevo_api_key_configured=true` pero automatización genérica y cola desactivadas.

## Puerta de validación
La beta puede avanzar sin funciones pagas, pero antes de promover producción se necesitan resultados de QA en móvil y escritorio, confirmación de la revisión de Pages mediante `staging-build.json`, prueba de sincronización cruzada, autorización artista, comprobantes de Bolsa, backup D1/KV consistente y revisión de segmentación publicitaria. Ninguna prueba debe copiar ni exponer credenciales privadas.
