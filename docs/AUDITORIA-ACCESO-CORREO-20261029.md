# Auditoría de accesos por correo — 29/10/2026

Estado público observado /api/access/email/status: build 11770, installed=true, enabled=true, qa_verification=true, qa_login=true, public_job_key_recovery_enabled=false. Consulta sin credenciales ni cambios de configuración.

No son el mismo circuito: acceso por correo a una cuenta previamente verificada y recuperación de claves antiguas de ofertas. El segundo permanece bloqueado en las dos rutas operativas. El módulo fuente scripts/job-recovery-outbox.mjs se declara preparatorio; al revisar el Worker completo se confirmó que su motor sí está incluido mediante uadavLiveMailCore para QA privada. No está integrado en las rutas públicas de recuperación antigua. Sus pruebas aisladas no prueban disponibilidad pública. Faltan integración HTTP y receptor de enlaces, configuración operativa y prueba real de recuperación para ese circuito antiguo.

38 pruebas aisladas de outbox y recuperación atómica de cuenta aprobadas; 21 pruebas UI de cuenta/Bolsa aprobadas. No enviaron correos reales ni alteraron datos remotos.

UI: se aclara que el correo debe estar confirmado antes de perder acceso, el ingreso mantiene la pestaña y solo se ofrece cuando enabled=true. Si se desactiva el servicio instalado, aparece aviso y se conserva acceso por comprobantes. Revisión previa del Admin verificó publicada la corrección de cancelación; conservación de vencimiento exacto probada localmente en la ronda anterior. Vencimiento automático remoto sigue pendiente de observar.

Producción intacta. Ninguna credencial, flag, migración o dato remoto modificado en esta ronda.
