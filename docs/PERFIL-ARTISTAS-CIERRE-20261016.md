# Perfil y Artistas — cierre de revisión del 16/10/2026

Rama audit/public-job-status-20261012. No fusionada ni desplegada a producción. Worker sin cambios en esta revisión.

## Correcciones nuevas
- Mi perfil recupera la comprobación de conexión tras error, con timeout10s, reintento visible y sin solicitudes superpuestas. Una respuesta HTTP fallida no habilita los controles aunque el JSON parezca válido.
- Recuperación explica que necesita el respaldo UAC-, distinto del acceso Admin y del código temporal. El campo se limpia al cerrar.
- Nombre/foto quedan asociados a la cuenta que comenzó la edición. Una carga tardía no modifica otra cuenta, no reemplaza una selección posterior ni restaura una foto eliminada. Fallos de lectura muestran cómo reintentar.
- Guía pública quitó IA profesional y STREAM+ futuro; apoyo quedó alineado con PRO. Manual y planes corrigen promociones propuestas de siete días; no activan precios ni cobros.
- Estadísticas/automatizaciones avanzadas no se anuncian como prestaciones ya disponibles.

## Pruebas de este cambio
20 pruebas locales pasaron:6 nuevas de interfaz/conexión/recuperación,6 nuevas de identidad en edición y8 de acceso/sincronización existentes. Sintaxis del JS y scripts inline correcta.
CI Platform integration checks525/run38971882912 y Job status contracts272/run38971882908 completaron success para e509c49f98a4a768b76024316d3b6fdba29eafbc.
Navegador staging cargó usuario con account-ui versión20261016-recovery. Abrir editor, escribir nombre ficticio y cancelar conservó Mi cuenta y devolvió foco a Editar perfil. No guardado remoto ni nueva credencial. Las carreras entre cuentas/fotos y fallas de red se probaron aisladamente, no provocadas en una cuenta real.

## Estado por circuito
| Circuito | Evidencia | Estado y límite |
| --- | --- | --- |
| Crear cuenta y artista sin YouTube | Recorrido real previo en staging, enlace automático | Comprobado para perfil sintético |
| Reclamar artista existente, aprobación, revocación y transferencia | Worker/SQLite y recuperación de fallas | Falta recorrido completo de pantallas de reclamo existente |
| Mi perfil abre gestión y consultas | Navegador real previo, sin enlace privado manual | Comprobado |
| Dos dispositivos acceden al mismo artista | Cliente real contra D1 remoto; revocar uno conserva el otro | Comprobado API/cliente; falta QR/cámara entre equipos físicos |
| Borrador privado y edición básica | Guardado/reapertura real y lookup público404 | Comprobado; no certifica importación multimedia completa |
| Consultas gratuitas | Formulario público → bandeja privada → Leída persistente | Comprobado |
| Permisos FREE/PRO/FREE | Admin y herramientas reales más pruebas aisladas | Comprobado sin pago real |
| Press Kit público/moderación | Pruebas aisladas de privacidad/publicación | Falta repetir ciclo completo con sesión autenticada |
| PDF Press Kit | Segundo PDF Android del usuario completo,2 páginas | Comprobado muestra sintética; falta foto, documentos largos/A4/PC |
| Recuperación y eliminación | Worker/SQLite con interrupción/rollback y nueva cuenta misma IP | Comprobado backend; falta recorrido completo de pantallas |
| Sesión de artista caducada/renovación | Pruebas de identidad, revocación y concurrencia | Comprobado aislado; no prueba uso continuo prolongado |
| Compra/renovación PRO y cupos | Simulaciones HMAC y SQLite; pantalla impide cobrar sin configuración | Falta proveedor bancario real y recorrido pago→permisos |
| Avisos y Web Push | Código y contratos; Push sin configurar | No certificado envío real |
| Videos/playlists/álbumes y catálogo descubierto | Fuera del alcance de esta revisión; staging sin clave YouTube | Pendiente integración real y reproducción |
| Estadísticas del artista | No certificadas en esta revisión | Pendiente; no vender como disponibles |
| Diseño móvil/tablet/TV | PDF Android y navegador PC parcial | Falta matriz física completa |

## Para avanzar sin mezclar pendientes
1. Mantener correcciones en rama/staging, sin lanzar cobros.
2. Recuperar una sesión válida de prueba para los recorridos privados restantes. El último ingreso seguro falló validación; no repetir ni reutilizar claves del Admin como recuperación.
3. Probar aprobación/publicación/retiro de Press Kit y reclamo existente desde las pantallas.
4. Completar catálogo multimedia y estadísticas por separado, con fuentes y métricas reales.
5. Configurar/verificar el banco antes de certificar activación comercial. Foto de comprobante no equivale a acreditación.
6. Aprobar producción sólo tras pruebas y autorización expresa del usuario.

Referencias: ARTIST-ACCOUNT-BROWSER-FLOW-20261016.md, PROFILE-CLOSURE-CHECKPOINT-20261016.md, ACCOUNT-RECOVERY-DELETION-20261016.md, PRESSKIT-UPLOADED-PDF-REVIEW-20261016.md. Esta tabla consolida evidencias; no significa sector100% terminado.
