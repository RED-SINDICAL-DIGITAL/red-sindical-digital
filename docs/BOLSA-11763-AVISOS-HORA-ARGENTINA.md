# Bolsa · hora argentina en Mis avisos · 26/10/2026

La captura aportada por el usuario confirmó en PC los avisos **Una de tus ofertas está por vencer** y **Tu oferta recibió una postulación**. Los dos elementos corresponden a hechos distintos. El primer aviso coincide con la entrega automática comprobada en D1 a las 14:45 de Argentina.

La fecha se mostraba como 02:45:40 sin indicar mañana/tarde. El componente dependía de toLocaleString sin una zona ni un ciclo horario explícitos. Se fija **America/Argentina/Buenos_Aires**, formato de **24 horas**, fecha completa y segundos, con la aclaración **hora argentina**. Ejemplos comprobados, incluso ejecutando Node con zona de Honolulu:

- 2026-10-26T17:45:40.988Z → **26/10/2026, 14:45:40 · hora argentina**.
- 2026-10-27T03:00:00.000Z → **27/10/2026, 00:00:00 · hora argentina**.

Se modifica únicamente la presentación temporal en el componente compartido de avisos; se conserva su transporte, control de cuenta y confirmación de lectura. usuario.html usa la nueva versión de caché **11763.3**. CI incorpora el módulo y el control existente de avisos entre cuentas en sus rutas vigiladas y pasos.

Validación local: **138 pruebas UI de Bolsa**, control existente de respuestas tardías/cambio de cuenta y acuses de lectura, importación/exportación, sintaxis y diff aprobados. No se añadieron pruebas nuevas para este ajuste visual. La entrega publicada y el estado de CI se registran por separado después de comprobarlos.

La captura original se conserva como archivo privado aportado por el usuario y no se copia al repositorio. No se cambia la fecha límite de la oferta, un dato de D1, el Worker, una credencial o una configuración productiva. El cierre y aviso posterior al vencimiento siguen requiriendo el ensayo real.
