# Bolsa de Trabajo · estado y cierre · actualización27/10/2026UTC

**Checkpoint posterior26/10Argentina:** siete fases11766-mail-lab-1 remotas aprobadas según operador; coincidencia exacta de versión/scope/huellas/etiquetas, sin lectura autenticada de Work. Evidencia `evidence/bolsa-11766-mail-lab-aprobado-20261027.json`.11767 nuevo Worker y receptor Pages preparados para QA real de una oferta ficticia cerrada/correo propio, canje por POST, clave vieja rechazada, bandeja con nueva y guardado voluntario en Mi Perfil. Código/pruebas locales, sin despliegue11767/canje real acreditado. Guía `BOLSA-11767-RECUPERACION-REAL-QA.md`. No repetir laboratorios o configuración Brevo; siguiente intervención es publicar receptor/Worker, un Secret de cifrado privado y una autorización de envío. Ambos endpoints de recuperación pública503. Los cinco bloques siguen abiertos en su alcance integral.

**Bolsa todavía no está completa.** La recepción real del correo diagnóstico11766 fue informada como aprobada por el operador: `received`, `sandbox:false`, `provider_accepted:true`, `delivery_verified:true`, `recovery_enabled:false`, `2026-10-27T00:39:26.248Z` (**26/10,21:39:26Argentina**). La recuperación pública sigue503. Evidencia `evidence/brevo-11766-recepcion-aprobada-20261027.json`. Work cotejó el reporte con código/flags, sin leer el estado autenticado, ejecutar el envío o cotejar JS remoto.

## Código, pruebas y despliegues

- API principal11766: código/ZIP en `96cf98a5db6de17b7d3e097a885bf7ee5599b826`; CI Bolsa40426233321/Radio40426233264 success,170Node/22workerd/12Radio. El reporte posterior del operador acredita el diagnóstico de esa versión, distinto de la última health pública independiente11764 a20:34:09.833UTC del26/10. El archivo remoto no se comparó byte a byte.
- Nuevo núcleo preparatorio: token recibido de256bits canjeable en lote D1 aunque se pierda la respuestaAPI; clave anterior conservada hasta el canje; snapshot completo cifrado e inmutable entre despliegues. Sustituye el diseño previo condicionado al recibo del proveedor. Ningún error de duplicado se convierte en recibo válido. No está importado en el Worker principal. Ver `BOLSA-CORREO-NUCLEO-TRANSACCIONAL-20261026.md`.
- Pruebas nuevas:197grupos focalizados aprobaron juntos antes del último caso adicional;32del núcleo actualizado, seis snapshot,17transporte y13laboratorio se verifican por archivo.23controles workerd locales aprobados. CI Bolsa40434894253 y Radio40434894235 success para e4035e2f0ad1f82b630464c1c04a39654a701447; todos los pasos aprobados. Suite focalizada actual198casos; no se obtuvo su log numérico. Evidencia `evidence/bolsa-11766-mail-lab-ci-y-entrega-20261027.json`. SQLite/red simulada/DOM no equivalen al nuevo ensayo D1 o dispositivos físicos.
- Nuevo artefacto: `releases/uadav-bolsa-mail-lab-11766.zip`, **solo para el laboratorio de Bolsa existente**. Siete fases nuevas con datos ficticios/cero correos reales, conserva las ocho anteriores. Preparado, no desplegado/ejecutado remotamente por Work. Guía `BOLSA-11766-LABORATORIO-RECUPERACION.md`.
- API principal, todos los ZIP/laboratorios anteriores y restore conservan sus bytes en esta revisión. Pages continúa en `7e16b2a815a218df870d7375ae565af6893afa70`; Admin/avisos11763 anteriores,138pruebas UI aprobadas en su entrega. Producción `main` sigue en `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`; sin cambios productivos.

Cloudflare rechazó el ingreso de Work mediante Google con **Unable to sign in**. No se diagnosticó bloqueo de bots ni se repitió ese intento. El operador pudo desplegar manualmente las entregas posteriores; se conserva ese método. No pedir otra vez configuración Brevo, correo diagnóstico, nuevas bases/claves o repetir el laboratorio11764 aprobado.

## Evidencia que ya aprobó

| Área | Evidencia y alcance |
|---|---|
| Publicación/postulación | Flujos gratuitos e inmediatos, consentimiento explícito, acceso privado y moderación posterior según entregas anteriores. Pruebas básicas PC/móvil registradas, distintas de cobertura física completa. |
| D1 y migración | Informe `already-d1`, respaldo consistente y preparación/pruebas transaccionales anteriores. Las credenciales operativas actuales están en D1 según diagnóstico informado; no activar variables productivas. |
| Importación | CSV y captura desde URL propia autorizada aprobadas. Fuente real ajena/transporte completo siguen pendientes. |
| Restore sintético | `uadav-restore-qa`,11762-restore-qa-1, seis fases con fixtures en D1 remoto informadas como aprobadas. No es recuperación integral del respaldo real. |
| Privacidad/concurrencia | `uadav-bolsa-lab`,11764-bolsa-lab-1, ocho fases remotas informadas como aprobadas: duplicados, consentimiento, dos cuentas/artistas, revocación, canje/rollback, límite e integridad. Evidencia `evidence/bolsa-11764-laboratorio-aprobado-20261026.json`. No repetir esas ocho fases. |
| Avisos previos | Turno14:45Argentina emitió exactamente un aviso para la cuenta correcta, visible en PC según captura. Turno15:00 emitió cero duplicados. Cron `*/15 * * * *`, `JOB_STAGING_CRON=bolsa-only`, conservado. |
| Correo | Brevo dominio/remitente por capturas;11765sandbox accepted, cero correos.11766diagnóstico real received según operador. No equivale a login o recuperación de una oferta. |

## Cinco bloques pendientes de cierre

| Bloque | Falta y siguiente validación |
|---|---|
| Recuperación por correo y cuenta | Siete fases nuevas D1 ya informadas aprobadas. Endpoints/receptor/UX de QA privada11767 escritos y probados localmente; falta desplegar y probar ese canje real. Después integración pública, abuso y tiempos uniformes, cuotas compartidas, correo verificado/sesiones de cuenta, Google opcional, exportación/restauración/retención/rotación y ensayo real completo. La solución local de respuesta perdida no habilita el servicio público. |
| Recuperación operativa completa | Respaldo privado real ensayado localmente, no restaurado íntegramente en remoto con cuentas/mensajes. Mantener restore operativo apagado; ensayo real requiere destino aislado y alcance explícito. |
| Fuente externa real | Incorporar una fuente real autorizada y probar bajas/errores. La comprobación DNS actual no fija la IP del fetch; sigue pendiente la revisión del transporte. |
| Vencimiento y avisos | QA `JOB-MVPJ9WRW-439D4126D9AE`, candidatura `POST-MVPJCNGX-E7683EC0`, fecha límite26/10. Verificar tras27/10 00:00Argentina (=03:00UTC): salida pública, rechazo de nuevas postulaciones, estado vencido, candidatura conservada, un aviso y siguiente turno sin duplicado. El reporte de correo00:39UTC era anterior a ese momento. No cambiar fecha, cerrar/renovar/republicar la QA ni alterar reloj global. |
| Dispositivos/UX | Completar Mi Perfil/perfil artístico, fallos, accesibilidad y pruebas en móvil/tablet/SmartTV físicos. DOM y básicos previos no acreditan cobertura completa. |

Último respaldo privado verificado: versión5,13ofertas/11postulaciones, siete credenciales, cinco vínculos y dos marcas de aviso;22registros anteriores cotejados. No contiene una prueba remota de recuperación integral y no debe subirse a GitHub o al nuevo laboratorio de correo.

## Próxima intervención concreta

Actualizar **solo `uadav-bolsa-lab`** con su nuevo ZIP; conservar DB/QA_BOLSA_KEY/QA_BOLSA_ONLY=true. Abrir la misma URL y clave, autorizar datos ficticios, ejecutar las siete fases nuevas y copiar reporte seguro. No redesplegar la API principal, crear otro Worker/base/clave, aplicar SQL manual o configurar Brevo. No hay cambios de cron, Pages, producción o activación de recuperación. Cartelera continúa después de cerrar y validar Bolsa. No dar un porcentaje o fecha garantizada que oculte estos pendientes.
