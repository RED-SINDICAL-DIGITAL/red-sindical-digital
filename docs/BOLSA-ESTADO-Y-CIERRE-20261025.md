# Bolsa de Trabajo · estado verificado y pendientes · revisión 26 de octubre de 2026

## Estado actual

**Bolsa todavía no está completa.** El último avance es un aviso previo automático real de 11763 a las 14:45 de Argentina para la nueva oferta QA con vencimiento 26/10. Oferta y candidatura con consentimiento están guardadas en la misma cuenta existente; se cotejaron marca y destinatario privados. Falta observar el aviso en el dispositivo de esa cuenta y probar el cierre y aviso posterior desde el 27/10 a las 00:00 de Argentina. El ensayo de restauración con fixtures ya aprobó en D1 remoto. La publicación y postulación abiertas, la gestión privada, la migración y las importaciones ya tienen evidencia previa; los bloques pendientes se distinguen debajo.

- Worker principal observado: **11763**. Código entregado `90df7e3c6561271fa6a185f664cc17816c28266c`, SHA256 `50d232f8b6e90cb54f266299b81d25c0a94af3c93687983f4389a9b0c1a0f348`; el archivo remoto no se cotejó byte por byte.
- Pages staging: rama en `b59c803f7b2e33575c4d1c5e4d227b9689be01fa`. Recurso de avisos 11763.1 y respaldo 11763.2 publicados y comprobados en Admin autenticado; SQL y controles de copia se ocultan hasta verificar una fuente KV. CI 40365969241 aprobado, 138 pruebas UI locales.
- Health principal observado el `2026-10-26T17:09:55.540Z` (**14:09 de Argentina**): ok, bindings D1/KV detectados, correo y cola apagados.
- Ensayo independiente desplegado: **uadav-restore-qa / 11762-restore-qa-1**. Sus seis fases aprobaron en la base vinculada, inicialmente vacía, con datos ficticios. El código de ejecución se guardó en `37e1cfbd9c10c7a8800d4a38b0b4b3ada0623f64`; CI Bolsa **40238857214** y Radio **40238857246** aprobadas.
- Último respaldo privado verificado: **versión 5**, 13 ofertas y 11 postulaciones, 7 credenciales, 5 vínculos y 2 marcas de aviso. Se cotejaron los 22 registros anteriores sin diferencias y se ensayó localmente su recuperación en seis lotes, con repetición, rollback/reintento e integridad correctos. No se subió ese respaldo a la herramienta QA.
- Producción sigue fuera de alcance: referencia comprobada `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`. No se modificaron ramas, variables, bases o despliegues productivos.

## Avances con evidencia

| Circuito | Qué se comprobó | Evidencia |
|---|---|---|
| Captura externa puntual | En 11762 se leyó una fuente ficticia propia, se incorporó una ficha, se repitió sin duplicar, se abrió el origen, se ocultó y se reimportó con fragmento sin reactivarla. El catálogo terminó con las cinco ofertas originales. | `BOLSA-11762-CAPTURA-QA-20261025.md` |
| Importación CSV | Importación, repetición y moderación posterior aprobadas previamente en staging 11760. | Registro previo y respaldo cotejado. |
| Respaldo real | Exportación D1 13/11, credenciales/vínculos/ledger presentes; los 22 registros previos sin diferencias. Versión 5 guardada con historial, recuperación local en seis lotes, repetición, rollback/reintento e integridad correctos. | `BOLSA-11763-AVISO-AUTOMATICO-QA-20261026.md` |
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
| Vencimientos y avisos | Aviso previo manual y nuevo aviso automático de las 14:45 aprobados en servidor; un mensaje y marcador para la cuenta correcta, revisión sin pendientes. Oferta/candidatura reales de QA ya guardadas, fecha límite 26/10. El turno siguiente de las 15:00 confirmó cero avisos nuevos. Falta ver el aviso en el dispositivo y el vencimiento/cierre/aviso posterior con candidatura preservada. | Esperar al 27/10 a las 00:00 de Argentina para el vencimiento, conservando la fecha actual; procedimiento 11763 actualizado. |
| Privacidad y concurrencia | Una cuenta y sus vínculos tienen evidencia. Falta segunda cuenta independiente, comprobante previo, vínculo voluntario con perfil artístico, aislamiento entre cuentas y solicitudes simultáneas en Cloudflare. | Acceso seguro al otro contexto de prueba; no crear una cuenta por caducidad de sesión. |
| Dispositivos y UX | PC/móvil básicos aprobados. Completar circuitos con cuenta y fallos en móvil, tablet, Smart TV y accesibilidad; actualizar manuales con lo validado. | Dispositivos físicos que no están disponibles en Work. |

## 11763 desplegado · primer turno automático exitoso verificado

Se preparó una entrada programada exclusiva para Bolsa, apagada por defecto, con lease D1, repetición segura y registro privado del resultado. También se corrigió el respeto de ofertas ocultas/cerradas, actividad numérica cero y fechas inválidas. Admin incorpora consulta automática de estado mediante GET, sin activar tareas ni enviar avisos. No hay SQL nuevo.

Pruebas locales: **73 Worker, 138 UI, 15 comprobaciones workerd y 12 estáticas de Radio**. No se activaron variables o triggers desde estas sesiones. El despliegue 11763 y la primera revisión se confirmaron mediante Admin. El turno de las 14:45 emitió un aviso previo real para la nueva QA; marca y mensaje para la cuenta vinculada cotejados en el respaldo. La configuración fue manual por el usuario y no se inspeccionó el dashboard. Falta el cierre/aviso posterior con fecha real y la comprobación visual del aviso en su dispositivo. Ver también `BOLSA-11763-CRON-PRIMERA-EJECUCION-20261026.md`. Ver `BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md`; no confundir esta preparación con la prueba remota del adaptador de restauración 11762 ya aprobada.

## Próxima prioridad y límites

Continuar con la oferta y candidatura ya creadas del procedimiento `BOLSA-11763-QA-VENCIMIENTO-REAL.md`, verificación del aviso en el dispositivo y ensayo con fecha real. No volver a publicar la misma QA ni cambiar su fecha para simular el vencimiento. El ingreso, configuración y primer recibo del cron ya se resolvieron; no pedir otra clave, reconfiguración o despliegue por esos bloqueos anteriores. No activar el programador compartido de una versión anterior. La recuperación por correo y la restauración de la base operativa permanecen deshabilitadas. Cartelera continúa después de cerrar y validar Bolsa.

La estimación anterior de 3–5 jornadas era provisional y anterior a estos avances. No se reemplaza por una fecha garantizada ni un porcentaje artificial: correo, pruebas entre cuentas, dispositivos y la espera de un vencimiento real siguen condicionando el cierre.
