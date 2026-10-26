# Bolsa · respaldo Admin sin repetir la preparación de D1 · 26/10/2026

## Cambio

En Auditoría, la pantalla inicial mostraba SQL, tres confirmaciones y botones de copia antes de conocer el almacenamiento actual. Bolsa ya opera en D1; esas instrucciones podían inducir a repetir un procedimiento terminado. La comprobación del respaldo ya bloqueaba esa copia, pero la presentación inicial seguía siendo confusa.

El panel comienza ahora como **Respaldo de Bolsa · Solo staging**, con generación explícita del respaldo y copia del informe seguro. SQL, confirmaciones y botones de migración aparecen únicamente después de verificar un respaldo cuyo origen sea KV. Si el respaldo actual verificado usa D1, el título pasa a **Respaldo de Bolsa en D1**, conserva conteos y descarga, y oculta esos pasos de migración. Una respuesta inválida o una descarga fallida conserva el estado sin verificar.

No se consulta ni descarga un respaldo automáticamente al abrir Auditoría. El controlador de verificación, descarga, tres confirmaciones, lotes e idempotencia permanece byte por byte sin cambios. La modificación afecta solo al montaje/presentación de `uadav-jobs-migration-admin.js` y al identificador de caché **11763.2** de ese recurso en `admin.html`. El componente de cron continúa en 11763.1.

## Validación y alcance

- **138 pruebas UI existentes aprobadas**, incluidas 16 de preparación/copia/backup, navegación, estados tardíos, aislamiento, acceso privado e importaciones.
- Importación/exportación Admin aprobada; sintaxis JS y diff sin errores.
- Comparación SHA256 del contenido anterior a `function mount` confirma que la lógica del controlador no cambió.
- La comprobación visual de la nueva presentación publicada se registra después del despliegue automático de Pages. Las pruebas existentes del controlador no equivalen a una prueba visual del modo D1 con descarga real.

Este cambio se guarda únicamente en `audit/continuidad-demo-20261019`. No requiere sustituir Worker, cambiar variables/bindings, ejecutar SQL o repetir la migración. La automatización de vencimientos sigue verificándose por separado; correo y restauración operativa no se habilitan.
