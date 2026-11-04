# Recuperación HTTP real y vigencia de destacados · 4/11/2026

El operador aportó resultado seguro de Worker 11770, scope brevo-recovery-staging, result complete, http_qa_flow true, sandbox false, provider_accepted true y real_email_received true. Los cuatro checks aprobaron enlace recibido/confirmado, revocación de clave anterior, acceso privado con clave nueva y oferta ficticia conservada sin publicación. recovery_enabled false: no se activó recuperación general. Esta evidencia reemplaza el pendiente histórico de esa prueba HTTP; no certifica ofertas reales heredadas.

## Mejora de vigencia
Admin ahora permite fecha y hora locales (datetime-local) al definir Destacado hasta. Convierte un cambio explícito a ISO UTC; si no se modifica el campo conserva el instante original, incluidos segundos y zona. El servidor sigue exigiendo vencimiento futuro; no se debilitó esa validación. 773/773 pruebas Pages aprobadas.

## Prueba remota pendiente
Intento inicial de preparar una prueba con vencimiento pasado: el servidor lo rechazó; no se confirmó creación. Se conserva el borrador en Admin para elegir vencimiento futuro cercano tras desplegar esta mejora. No repetir creación sin comprobar lista. Debe observarse estado almacenado inicial destacado=true, vencimiento y transición automática destacado=false/estado vencido sin invocar mantenimiento manual. La ausencia visual por fecha no basta por sí sola para certificar cron. No hay cobros ni cambios de producción.
