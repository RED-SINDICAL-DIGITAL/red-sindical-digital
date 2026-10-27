# Bolsa de Trabajo · estado real al27/10/2026

Solo staging. Producción/main conserva `fd9799cdbaba5ff522dcff45a67a4bc9a9de90bd`. No mezclar ramas ni desplegar allí. La plataforma conserva publicación gratuita e inmediata, postulaciones con consentimiento y moderación posterior.

## Evidencias cerradas

- D1 operativo y migración comparada según diagnósticos previos del operador. Política pública, acceso privado, cierre/renovación, duplicados atómicos, privacidad, moderación posterior y compatibilidad KV cubiertos por código/pruebas anteriores.
- Laboratorios11762,11764 y11766-mail completados por el operador. No repetirlos.
- Correo11766 recibido y recuperación real privada11767 `complete`, con clave anterior revocada y nueva autoridad privada; no acredita login general. No repetir ese correo.
-11768 `complete`, respaldo14ofertas/11postulaciones guardado, nueve comprobaciones de vencimiento y dos cron distintos sin duplicado según operador. Work observó health11768 y un único POST sintético a la QA vencida rechazado404 sin recibo. **No repetir esa prueba ni modificar su oferta/candidatura.** Evidencias separadas en `docs/evidence/bolsa-11768-*`.

## Entrega nueva11769

Código preparado y probado; desplegar un Worker es distinto de guardar su código o aprobar CI. La API observada antes de esta entrega todavía era11768. Guía única: [BOLSA-11769-ENTREGA-INTEGRADA.md](BOLSA-11769-ENTREGA-INTEGRADA.md). ZIP con dos archivos para los dos Workers existentes; no requiere nuevas bases, claves o cron. Pages se publica desde su propia rama de staging.

| Frente | Implementado y probado localmente | Validación que falta |
|---|---|---|
| Cuenta y correo | Cuenta estable, correo privado cifrado/verificado con consentimiento, creación solo después de prueba, login a la misma biblioteca/trabajos/permisos, cambio verificado, cuotas atómicas, respuesta uniforme, outbox inmutable y canje idempotente. Rotación avanzada con candidato duradero, control de versión y reconciliación. Integración de borrado/revocación/backup. | Desplegar11769; desde la cuenta original confirmar el correo QA y luego entrar con un segundo enlace en otro dispositivo. Backend permite activación de staging solo tras ambas pruebas de esa misma cuenta/revisión. Las rutas antiguas por clave de oferta siguen503. Google es opcional posterior. |
| Respaldo/recuperación | Export permanente coherente en D1, excluye pruebas y activación; incluye identidades cifradas y versiones de respaldo. Nuevo restore solo en el Worker/DB QA existente,18tablas seleccionadas y22claves KV, rollback provocado, reanudación, comparación e idempotencia. Preserva fixtures anteriores. | Descargar captura nueva tras verificar/entrar por correo y ensayarla en la DB aislada. No afirmar recuperación de pagos o toda la plataforma. Restore operativo permanece apagado; la copia histórica exige tratar revocaciones/borrados posteriores antes de una futura promoción. |
| Fuentes reales | Transporte operativo restringido a editores explícitos y redirecciones revisadas; otros dominios por HTML/CSV sin conexión del servidor. Feed fijo de Agencia Beat/Google Blogger con filtro laboral y revisión Admin, sin autopublicación. Lectura real de25entradas y0convocatorias elegibles, sin escrituras. | Incorporar una convocatoria real elegible/autorizada y observar su ficha, baja/errores. DNS previo no es fijación de IP; no afirmar fetch arbitrario seguro. Cero candidatas no se convierte en empleo inventado. |
| Dispositivos/UX | Acceso por correo desde Mi Perfil; completar nombre/correo verificado explícitamente sin reemplazar datos escritos ni consentir la postulación. Botones/errores/pantallas y carreras de cuenta cubiertos por DOM/red simulada. | PC y celular físicos: recepción/canje, misma cuenta y autoridad, formularios, reintentos, navegación, teclado y accesibilidad. No confundir DOM o workerd con revisión visual/física. |
| Vencimiento/avisos | Aprobado11768 para la QA original, historial preservado, un aviso/mensaje para la cuenta correcta y rechazo de nuevas candidaturas tras la fecha. | Nada pendiente de esa QA. No pedir otros dos cron, nuevo respaldo11768 o repetir el POST. |

## Pruebas y límites

11769:294/294Node Worker,186/186Node Pages,32controles workerd1.20261025.1 y12/12Radio. Política pública, KV, cuenta/borrado, avisos, importación/exportación, fuentes, sintaxis y ZIP aprobados.51artefactos anteriores idénticos. Evidencia local `evidence/bolsa-11769-verificacion-local-20261027.json`; CI y commits se registran después de publicar las ramas.

Ningún envío real11769, lectura del respaldo privado, SQL remoto o despliegue Worker11769 por Work. El feed público fue leído sin publicar. La descarga de Chromium para revisión visual falló; no se insistió. El login Cloudflare anterior devolvió `Unable to sign in`; se conserva el despliegue manual, sin afirmar bloqueo de bots.

Brevo usa la configuración ya existente. Presupuesto del circuito nuevo240/díaUTC compartido por todas sus secciones; cuota gratuita observada del proveedor300/día, también compartida con otros usos. No ilimitado ni plan pago. No enviar claves permanentes ni pedirlas por chat/TXT. Los avisos comunes siguen dentro de Mi Perfil.

No declarar Bolsa completa por el CI. Primero cerrar la secuencia11769 y registrar los resultados pendientes de la tabla; después continuar Cartelera, Admin, Mi Perfil y Radio sin cambiar producción. Los accesos avanzados, comprobantes y QR se conservan durante la transición.
