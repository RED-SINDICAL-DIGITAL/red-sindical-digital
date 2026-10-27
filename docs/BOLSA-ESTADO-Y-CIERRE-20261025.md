# Bolsa de Trabajo · estado y cierre · actualización27/10/2026 Argentina

**La recuperación real controlada11767 está aprobada según el reporte del operador. Bolsa todavía no está completa.** El informe `brevo-recovery-staging`, `complete`, confirma enlace recibido/confirmado, revocación de la clave anterior, acceso privado nuevo y oferta ficticia conservada sin publicación; `recovery_enabled:false`. No incluye hora de ejecución. Work cotejó versión, flags y las cuatro etiquetas con el código, sin lectura autenticada o cotejo remoto de JavaScript. Evidencia: `evidence/bolsa-11767-recuperacion-real-aprobada-20261027.json`.

11768 ya fue desplegado por el operador: respaldo14ofertas/11postulaciones guardado según reporte13:05Argentina, captura D1 consistente, autenticación temporal excluida, nueve checks y dos turnos del cron sin duplicados. Work confirmó health11768 y rechazo HTTP404 a un único POST sintético contra la QA vencida. El bloque de vencimiento/avisos queda aprobado para esa QA. Evidencias `evidence/bolsa-11768-respaldo-vencimiento-aprobado-20261027.json` y `evidence/bolsa-11768-rechazo-vencimiento-http-20261027.json`. No repetir despliegue, respaldo, espera de cron, correo11767, laboratorio, Pages, Brevo, DNS o secretos. El respaldo íntegro y sus hashes no fueron leídos/recalculados por Work.

## Código, pruebas y despliegues

| Alcance | Estado acreditado |
|---|---|
| Worker11767 | Código/ZIP en `2abb579e65f360b462e216890f3c3f53f427e0bf`. CI Bolsa40444919105 y Radio40444919072 success;227pruebas Node,25controles workerd y12Radio en la entrega. Despliegue y recuperación reales informados por el operador; no despliegue autenticado por Work. |
| Pages receptor11767.1 | Rama `audit/continuidad-demo-20261019`, commit `86c765293a78fd0d7be69524a78520e8c94a8d81`,151pruebas y CI40444874718 success. Cloudflare informó despliegue exitoso; receptor abierto en su dominio principal sin token, confirmación deshabilitada. Sin cambios en11768. |
| Worker11768 | Código/ZIP en `c782c2541d93f728eba8f4cbc82a519c98511c59`;252Node/27workerd/12Radio locales y CI Bolsa40451323481/Radio40451323476 success. Despliegue y diagnóstico aprobados según operador; health y rechazo de postulación vencida observados por HTTP por Work. Sin correo nuevo, SQL remoto, lectura Admin o restauración del respaldo privado por Work. |
| Producción | `main` conserva `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`. No mezclar ramas, activar flags productivos o modificar producción. |

Cloudflare rechazó el ingreso de Work mediante Google con **Unable to sign in**. No se diagnosticó bloqueo de bots ni se repitió ese intento. El operador despliega manualmente los paquetes; se conserva ese método.

## Evidencias ya aprobadas

| Área | Evidencia y alcance |
|---|---|
| Publicación/postulación | Política gratuita e inmediata, consentimiento explícito, acceso privado y moderación posterior cubiertos por código y pruebas de entregas previas. Pruebas básicas PC/móvil no equivalen a cobertura física completa. |
| D1/migración | `already-d1`, respaldo consistente y pruebas transaccionales anteriores. Almacenamiento operativo en D1 según diagnóstico del operador. |
| Importación | CSV y URL propia autorizada aprobados; fuente real ajena y transporte completo pendientes. |
| Restore sintético | `uadav-restore-qa`,11762, seis fases remotas con fixtures informadas aprobadas. Respaldo real ensayado localmente, sin restauración remota integral. |
| Privacidad/concurrencia | Ocho fases11764 y siete fases11766-mail-lab-1 informadas aprobadas; versiones, huellas y etiquetas cotejadas. No repetir. |
| Avisos previos | Turno14:45Argentina produjo un aviso visible en PC;15:00 produjo cero duplicados según evidencias anteriores. Cron `*/15 * * * *`, `JOB_STAGING_CRON=bolsa-only`, conservado. |
| Correo real |11766 diagnóstico recibido;11767 recuperación controlada completada. No habilita recuperación pública o acceso general a Mi Perfil por correo. |

## Cuatro bloques pendientes y vencimiento aprobado

| Bloque | Falta y siguiente validación |
|---|---|
| Recuperación pública y cuenta | QA real11767 aprobada. Faltan destinatario de recuperación verificado/consentido para ofertas existentes, antienumeración y tiempos uniformes, cuotas/abuso globales, integración general con cuenta/correo verificado y sesiones, migración voluntaria y QA completa. Google sigue como opción de producto posterior, no requisito artificial para cerrar Bolsa. Retención/backup11768 son avances parciales; rotación y política integral siguen abiertas. Mantener rutas públicas503. |
| Recuperación operativa completa | Probar restauración del respaldo real en destino aislado incluyendo cuentas/mensajes y autoridad vigente.11768 protege nuevas capturas e invalida pruebas temporales al restaurar ofertas faltantes; no acredita desastre integral remoto. Mantener flags de restore apagados. |
| Fuente externa real | Incorporar fuente autorizada y probar bajas/errores. El transporte DNS/fetch aún requiere resolver la separación entre validación y conexión/IP. |
| Vencimiento y avisos · aprobado | QA original con fecha intacta, vencida, candidatura conservada y un aviso/mensaje para la cuenta correcta en dos turnos distintos según operador. POST real sintético posterior rechazado404 sin credencial; listado público todavía la excluye. No repetir ni modificar esa oferta/candidatura. La prueba de la pantalla fue read-only; el POST separado pudo incrementar el contador temporal de abuso. |
| Dispositivos/UX | Completar Mi Perfil/perfil artístico, errores, accesibilidad y pruebas físicas PC/móvil/tablet/SmartTV según funciones. DOM, red simulada y básicos previos no acreditan todo el circuito. |

Último respaldo privado11768:14ofertas/11postulaciones, guardado por el operador según confirmación. SHA del archivo `a8da0c49e05a2e6a4b9fd30421c6f59206932802e7b787caf7c32800f44e145a`; checksum estructural distinto registrado en la evidencia. Work no abrió ese archivo o recalculó sus huellas. No subir respaldos íntegros a GitHub o laboratorios. El anterior13/11 solo acredita sus ensayos previos.

## Próximo paso concreto

No hay intervención pendiente del operador para11768. Siguiente prioridad de implementación: destinatario verificado/consentido y acceso sencillo por correo desde Mi Perfil, con cuotas/abuso y revocación transaccionales antes de publicar la recuperación general. La rotación de una oferta probada no equivale a recuperar una cuenta UADAV. Restauración integral, fuente externa y pruebas físicas siguen aparte. No activar recuperación pública o restore por un reporte `complete`. Cartelera continúa después de cerrar y validar Bolsa; no prometer porcentaje o fecha que oculte estos pendientes.
