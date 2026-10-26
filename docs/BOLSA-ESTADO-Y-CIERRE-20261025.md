# Bolsa de Trabajo · estado verificado y pendientes · revisión 26 de octubre de 2026

## Estado actual

**Bolsa todavía no está completa.** El último avance es la confirmación del despliegue 11763; su consulta privada de estado todavía requiere ingreso manual. El ensayo de restauración con fixtures ya aprobó en D1 remoto. La publicación y postulación abiertas, la gestión privada, la migración y las importaciones ya tienen evidencia previa; los bloques pendientes se distinguen debajo.

- Worker principal observado: **11763**. Código entregado `90df7e3c6561271fa6a185f664cc17816c28266c`, SHA256 `50d232f8b6e90cb54f266299b81d25c0a94af3c93687983f4389a9b0c1a0f348`; el archivo remoto no se cotejó byte por byte.
- Pages staging: rama en `fac819c014013d2359eb434fd7017030011e03d5`. Se observaron publicados el recurso de avisos 11763.1 y la guía actualizada; falta comprobar el panel con sesión Admin.
- Health principal observado el `2026-10-26T15:48:31.957Z` (**12:48 de Argentina**): ok, bindings D1/KV detectados, correo y cola apagados.
- Ensayo independiente desplegado: **uadav-restore-qa / 11762-restore-qa-1**. Sus seis fases aprobaron en la base vinculada, inicialmente vacía, con datos ficticios. El código de ejecución se guardó en `37e1cfbd9c10c7a8800d4a38b0b4b3ada0623f64`; CI Bolsa **40238857214** y Radio **40238857246** aprobadas.
- Último respaldo privado verificado: **versión 4**, 12 ofertas y 10 postulaciones, 6 credenciales, 3 vínculos y 1 marca de aviso. Se cotejaron los 21 registros anteriores sin diferencias y se ensayó localmente su recuperación. No se subió ese respaldo a la herramienta QA.
- Producción sigue fuera de alcance: referencia comprobada `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`. No se modificaron ramas, variables, bases o despliegues productivos.

## Avances con evidencia

| Circuito | Qué se comprobó | Evidencia |
|---|---|---|
| Captura externa puntual | En 11762 se leyó una fuente ficticia propia, se incorporó una ficha, se repitió sin duplicar, se abrió el origen, se ocultó y se reimportó con fragmento sin reactivarla. El catálogo terminó con las cinco ofertas originales. | `BOLSA-11762-CAPTURA-QA-20261025.md` |
| Importación CSV | Importación, repetición y moderación posterior aprobadas previamente en staging 11760. | Registro previo y respaldo cotejado. |
| Respaldo real | Exportación D1 12/10, credenciales/vínculos/ledger presentes; cotejo de proyección e integridad y recuperación local, repetición, fallo y reintento. | `BOLSA-11762-CAPTURA-QA-20261025.md` |
| Restauración D1 aislada | Seis fases remotas con el handler real: bloqueo por defecto, recuperación de dos parejas ficticias, repetición sin duplicados, rollback, reintento y cotejo. Conteos exigidos: 2 ofertas, 2 postulaciones, 2 credenciales, 4 vínculos y 2 marcas de aviso. | `BOLSA-11762-RESTAURACION-QA-APROBADA-20261025.md` |
| Avisos previos y gestión | Aviso previo leído en Mi Perfil, renovación y cierre de la oferta QA, candidaturas conservadas. | `BOLSA-11760-AVISOS-STAGING.md` y registro de continuidad. |
| Flujos básicos | Publicación gratuita e inmediata, consentimiento, acceso privado, moderación posterior y pruebas básicas PC/móvil ya registradas. | Registros anteriores de staging; no equivalen a pruebas completas de todos los dispositivos. |

El fallo de captura de 11761 quedó resuelto en 11762: el motor workerd no admite `redirect: "error"` para el resolvedor. Se cambió a manual y rechazo de redirecciones; la lectura real aprobó después. El anterior bloqueo de `QA_RESTORE_KEY` también quedó resuelto por el usuario; no volver a pedir esos ajustes como si siguieran pendientes.

## Pendientes para el cierre

| Bloque | Estado y trabajo que falta | Dependencia |
|---|---|---|
| Fuentes externas | CSV y URL propia aprobados. Falta una fuente real autorizada, cierres/errores y control de salida pública con alcance productivo. La comprobación DNS actual no fija la IP del fetch; no dar ese riesgo por cerrado. | Fuente autorizada y revisión del transporte. |
| Recuperación por correo | Sigue deshabilitada, con endpoints 503. Falta emisión/entrega transaccional con proveedor, un solo uso, vencimiento, límites/reintentos y revocación atómica de la clave anterior. | Proveedor, remitente/dominio verificado y secretos mediante ingreso seguro. |
| Recuperación operativa completa | Handler y transacciones D1 aprobados con fixtures; respaldo real ensayado localmente. No se restauró remotamente el respaldo privado completo ni se acredita recuperación integral de cuentas/mensajes. Mantener cerrado restore sobre la base operativa. | Alcance explícito de un ensayo con datos reales y destino aislado. |
| Vencimientos y avisos | Aviso previo aprobado. Falta vencimiento real y aviso posterior, ejecución programada e idempotencia en remoto. El `scheduled` de 11763 ya acota el alcance a Bolsa y queda apagado por defecto. Falta observar su estado privado y verificar la configuración y ejecución remotas. | Preparar y probar la ejecución acotada; configuración manual de staging cuando corresponda. |
| Privacidad y concurrencia | Una cuenta y sus vínculos tienen evidencia. Falta segunda cuenta independiente, comprobante previo, vínculo voluntario con perfil artístico, aislamiento entre cuentas y solicitudes simultáneas en Cloudflare. | Acceso seguro al otro contexto de prueba; no crear una cuenta por caducidad de sesión. |
| Dispositivos y UX | PC/móvil básicos aprobados. Completar circuitos con cuenta y fallos en móvil, tablet, Smart TV y accesibilidad; actualizar manuales con lo validado. | Dispositivos físicos que no están disponibles en Work. |

## 11763 desplegado · verificación privada pendiente

Se preparó una entrada programada exclusiva para Bolsa, apagada por defecto, con lease D1, repetición segura y registro privado del resultado. También se corrigió el respeto de ofertas ocultas/cerradas, actividad numérica cero y fechas inválidas. Admin incorpora consulta automática de estado mediante GET, sin activar tareas ni enviar avisos. No hay SQL nuevo.

Pruebas locales: **73 Worker, 138 UI, 15 comprobaciones workerd y 12 estáticas de Radio**. No se activaron variables o triggers desde estas sesiones. El despliegue 11763 se confirmó; el estado privado, el primer evento y un vencimiento/aviso reales siguen pendientes. Ver `BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md`; no confundir esta preparación con la prueba remota del adaptador de restauración 11762 ya aprobada.

## Próxima prioridad y límites

Continuar con el ingreso manual de Admin en Work y la consulta privada del estado de 11763. Después podrá prepararse la configuración de su cron exclusivo. No activar el programador compartido de una versión anterior. La recuperación por correo y la restauración de la base operativa permanecen deshabilitadas. Cartelera continúa después de cerrar y validar Bolsa.

La estimación anterior de 3–5 jornadas era provisional y anterior a estos avances. No se reemplaza por una fecha garantizada ni un porcentaje artificial: correo, pruebas entre cuentas, dispositivos y la espera de un vencimiento real siguen condicionando el cierre.
