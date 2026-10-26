# Bolsa de Trabajo · estado verificado y pendientes · revisión 26 de octubre de 2026

## Estado actual

**Bolsa todavía no está completa.** El operador entregó health y resultado `complete` del laboratorio 11764 en Cloudflare: ocho fases de concurrencia, privacidad entre cuentas/perfiles, canje único, rollback y límites atómicos aprobadas. Informe cotejado con el núcleo y las etiquetas del código entregado; no fue una ejecución ni lectura autenticada de Work. También aprobaron el aviso previo automático de la QA11763, su visualización en PC y el turno posterior sin duplicado. Falta probar el cierre y aviso posterior desde el 27/10 a las 00:00 de Argentina. El ensayo de restauración con fixtures ya aprobó en D1 remoto. Los cinco bloques restantes se distinguen debajo.

Avance 26/10: **11764 observada en staging** después del despliegue manual del operador; corrige el guardado de una postulación con credencial artística de otra cuenta. Health recargado a las **17:34 de Argentina**, `2026-10-26T20:34:09.833Z`: 11764, ok, D1/KV detectados, correo/cola apagados. El catálogo conserva seis ofertas, incluida la QA11763. El laboratorio separado con dos cuentas ficticias y ocho fases ya tiene informe remoto aprobado del operador, conservado en `evidence/bolsa-11764-laboratorio-aprobado-20261026.json`. **82 pruebas Bolsa y 18 workerd locales aprobadas**, además de ese ensayo remoto informado. Guía y límites: `BOLSA-11764-PRIVACIDAD-Y-LABORATORIO.md`.

Commit de código/artefactos `7fd54d11be324e75e595a6452950111512ad2fb9`; CI Bolsa40383520286 y Radio40383520281 `success`. Google fue autorizado y elegido mediante ingreso seguro; Cloudflare rechazó el ingreso de Work con **Unable to sign in**, sin diagnóstico de bots. Ese rechazo no impidió al operador desplegar manualmente 11764. No hay dashboard autenticado de Work ni nuevo recibo privado de cron comprobados; no repetir el ingreso Google, el despliegue principal o la configuración del cron por los bloqueos anteriores.

- Worker principal observado: **11764**. Código entregado `7fd54d11be324e75e595a6452950111512ad2fb9`, SHA256 `c98d9c5bcffec76beb68fb4075f8b967c019667923c425081d794191f0cff90f`; el archivo remoto no se cotejó byte por byte.
- Pages staging: código en `7e16b2a815a218df870d7375ae565af6893afa70`. Admin conserva cron 11763.1 y respaldo 11763.2; Mi Perfil sirve avisos 11763.3 con Argentina/24h explícitos, tras detectar una hora ambigua en la captura. CI 40376703081 aprobado, 138 pruebas UI y control existente de avisos entre cuentas. La nueva representación horaria en el dispositivo destinatario no se volvió a observar.
- Health principal observado el `2026-10-26T20:34:09.833Z` (**17:34 de Argentina**): 11764, ok, bindings D1/KV detectados, correo y cola apagados.
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
| Privacidad y concurrencia D1 | Informe del operador: ocho fases remotas aprobadas con dos cuentas ficticias, publicación/postulación simultáneas, consentimiento y artista, comprobante anterior, revocación, canje único, rollback/reintento y límite atómico/integridad. Versión, propósito, SHA256 y etiquetas coinciden con el código. Work no ejecutó ni leyó el estado autenticado. | `evidence/bolsa-11764-laboratorio-aprobado-20261026.json` |
| Avisos previos y gestión | Aviso previo leído en Mi Perfil, renovación y cierre de la oferta QA, candidaturas conservadas. | `BOLSA-11760-AVISOS-STAGING.md` y registro de continuidad. |
| Flujos básicos | Publicación gratuita e inmediata, consentimiento, acceso privado, moderación posterior y pruebas básicas PC/móvil ya registradas. | Registros anteriores de staging; no equivalen a pruebas completas de todos los dispositivos. |

El fallo de captura de 11761 quedó resuelto en 11762: el motor workerd no admite `redirect: "error"` para el resolvedor. Se cambió a manual y rechazo de redirecciones; la lectura real aprobó después. El anterior bloqueo de `QA_RESTORE_KEY` también quedó resuelto por el usuario; no volver a pedir esos ajustes como si siguieran pendientes.

## Pendientes para el cierre

| Bloque | Estado y trabajo que falta | Dependencia |
|---|---|---|
| Fuentes externas | CSV y URL propia aprobados. Falta una fuente real autorizada, cierres/errores y control de salida pública con alcance productivo. La comprobación DNS actual no fija la IP del fetch; no dar ese riesgo por cerrado. | Fuente autorizada y revisión del transporte. |
| Recuperación por correo | Sigue deshabilitada, con endpoints 503. El helper de canje único y rollback/reintento aprobó en el laboratorio remoto informado; eso no acredita emisión/entrega. Falta el circuito completo de emisión transaccional, proveedor, vencimiento, límites/reintentos y prueba de recepción/canje desde correo real. | Proveedor, remitente/dominio verificado y secretos mediante ingreso seguro. |
| Recuperación operativa completa | Handler y transacciones D1 aprobados con fixtures; respaldo real ensayado localmente. No se restauró remotamente el respaldo privado completo ni se acredita recuperación integral de cuentas/mensajes. Mantener cerrado restore sobre la base operativa. | Alcance explícito de un ensayo con datos reales y destino aislado. |
| Vencimientos y avisos | Aviso previo manual y nuevo aviso automático de las 14:45 aprobados en servidor; un mensaje y marcador para la cuenta correcta, revisión sin pendientes. Oferta/candidatura reales de QA ya guardadas, fecha límite 26/10. El turno siguiente de las 15:00 confirmó cero avisos nuevos. La visualización en PC aprobó con captura del usuario. Falta vencimiento/cierre/aviso posterior con candidatura preservada. | Esperar al 27/10 a las 00:00 de Argentina para el vencimiento, conservando la fecha actual; procedimiento 11763 actualizado. |
| Dispositivos y UX | PC/móvil básicos y backend entre cuentas ficticias aprobados. Completar experiencia de Mi Perfil/perfil artístico y fallos en móvil, tablet, Smart TV y accesibilidad; actualizar manuales con lo validado. | Dispositivos físicos que no están disponibles en Work. |

## 11763 desplegado · primer turno automático exitoso verificado

Se preparó una entrada programada exclusiva para Bolsa, apagada por defecto, con lease D1, repetición segura y registro privado del resultado. También se corrigió el respeto de ofertas ocultas/cerradas, actividad numérica cero y fechas inválidas. Admin incorpora consulta automática de estado mediante GET, sin activar tareas ni enviar avisos. No hay SQL nuevo.

Pruebas locales: **73 Worker, 138 UI, 15 comprobaciones workerd y 12 estáticas de Radio**. No se activaron variables o triggers desde estas sesiones. El despliegue 11763 y la primera revisión se confirmaron mediante Admin. El turno de las 14:45 emitió un aviso previo real para la nueva QA; marca y mensaje para la cuenta vinculada cotejados en el respaldo. La configuración fue manual por el usuario y no se inspeccionó el dashboard. La comprobación visual del aviso en PC ya aprobó; falta cierre/aviso posterior con fecha real. Ver también BOLSA-11763-AVISO-VISIBLE-20261026.md. Ver también `BOLSA-11763-CRON-PRIMERA-EJECUCION-20261026.md`. Ver `BOLSA-11763-VENCIMIENTOS-Y-CRON-STAGING.md`; no confundir esta preparación con la prueba remota del adaptador de restauración 11762 ya aprobada.

## Próxima prioridad y límites

11764 ya está observada en staging y el laboratorio tiene sus ocho fases informadas como aprobadas; no pedir otra vez despliegue o repetición por los bloqueos anteriores. Avanzar con emisión/entrega transaccional de recuperación manteniendo las rutas 503 hasta validar el circuito completo. Conservar el cron que ya funciona. Continuar también con la oferta y candidatura del procedimiento `BOLSA-11763-QA-VENCIMIENTO-REAL.md`, ensayo posterior al vencimiento con fecha real. La visualización del aviso previo en PC ya aprobó. No volver a publicar la misma QA ni cambiar su fecha para simular el vencimiento. No activar el programador compartido de una versión anterior. La restauración de la base operativa permanece deshabilitada. Cartelera continúa después de cerrar y validar Bolsa.

La estimación anterior de 3–5 jornadas era provisional y anterior a estos avances. No se reemplaza por una fecha garantizada ni un porcentaje artificial: correo, pruebas entre cuentas, dispositivos y la espera de un vencimiento real siguen condicionando el cierre.
