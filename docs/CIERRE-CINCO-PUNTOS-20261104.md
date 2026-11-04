# Cierre integral: evidencia y plan de publicación — 2026-11-04
Alcance: staging. No autoriza producción.

## 1. Mi Perfil y Biblioteca
Verificado navegador: Mi Perfil abre Biblioteca; historial contiene los dos videos reproducidos durante QA. Cuenta no vinculada: se informa necesidad de vincular para sincronización entre dispositivos.
850/850 pruebas de interfaz, incluidas persistencia, filas dañadas, errores de almacenamiento, favoritos, playlists, seguimiento, enlaces compartidos y conflictos de sincronización.
Pendiente: recorrido real con cuenta vinculada entre dos dispositivos. Las pruebas automatizadas no lo sustituyen.

## 2. Admin
Acceso actual observado: pantalla de login, API disponible V11.7. Sesión anterior no recuperada. No se leyó clave ni se asumió acceso.
Pendiente autenticación segura para verificar Centro de Diseño y escritura/lectura real de una modificación reversible. No crear campañas ni modificar contenidos sin inspeccionar primero el estado actual.

## 3. Bolsa y Cartelera
96/96 pruebas seleccionadas de Worker aprobadas: publicación atómica, operaciones, restauración/rollback, backup, expiración de ofertas, notificaciones, snapshot, política de correo, readiness y laboratorio aislado. También se incluyó política de publicidad.
Recepción real de recuperación Bolsa y aviso Cartelera confirmada previamente por operador. No se enviaron correos nuevos en esta revisión.
Pendiente final operativo: comprobar los controles de Admin actuales y reunir evidencia cron/vencimiento en el despliegue vigente si no consta ya. No duplicar QA ni publicar ofertas/eventos reales por probar.

## 4. Publicidad
Código actual: campaña nacional opcional, provincia obligatoria y válida para alcance provincial; país debe coincidir, provincia debe coincidir, ciudad si corresponde. Sin GPS solicitado.
Entrega exige campaña activa, pago marcado paid o waived, delivery_verified=true y fechas vigentes. Comprobante no equivale a ingreso bancario verificado.
Catálogo contiene 12 productos inactivos: Cartelera 7/15/30 días ARS 5000/9000/15000; Hero 12000/22000/36000; combo 15000/28000/45000; radio30d 20000; banner30d30000; auspicio30d desde50000.
Esto registra el código real; no reemplaza una aprobación comercial. Existen referencias históricas distintas de precios: no se cambian ni activan cobros automáticamente.
Pendiente: evidencia de entrega real de una campaña sintética por provincia y nacional en las ubicaciones, sin pagos.

## 5. Preparación productiva, todavía bloqueada
Antes de pedir autorización final:
- Identificar SHA exacto de Pages y Worker efectivamente desplegados y conservar versión anterior recuperable. Build11770 por sí solo no identifica el archivo.
- Inventario de bindings/variables por nombre, sin copiar secretos, y diferencias staging/producción.
- Exportar respaldo consistente de producción mediante operador autorizado antes de cualquier migración; comprobar integridad y restauración en D1 aislado. No importar el backup staging sobre producción.
- Inventariar datos ficticios y placas de ejemplo; decidir qué se retira o conserva identificado. No borrado irreversible.
- Confirmar correo, Turnstile, orígenes, rutas y permisos del dominio final; no habilitar por inferencia.
- Validar recorridos críticos en PC/móvil y revisar tablet/TV sin atribuir pruebas físicas no hechas.
- Preparar cambios separados de Pages/Worker, smoke tests y condiciones de reversión: fallos de acceso privado, publicación, reproducción, consentimiento o lectura D1.
- Solicitar autorización específica con versión, destino, alcance y respaldo concreto. Producción sigue intacta.

## Límites
No se certifica cierre de los cinco bloques solo por las 946 pruebas. Hay controles manuales y acceso Admin pendientes. Ningún cambio de variables, migraciones ni despliegue productivo realizado.
