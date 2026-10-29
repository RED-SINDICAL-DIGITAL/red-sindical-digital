# Vencimiento de destacados — staging, 29/10/2026

Se corrige el mantenimiento canónico y su copia embebida: el destacado vence al llegar a `destacado_hasta` (`<=`), no solamente después.

## Verificación

- 440/440 pruebas Worker aprobadas; 9/9 del módulo operacional.
- Prueba SQLite: un milisegundo antes permanece; en el límite vence; conserva publicación gratuita, fuente, fechas, título y lugar; repetir mantenimiento no vuelve a cambiar el registro ni escribe KV.
- La prueba usa reloj explícito y base aislada. No demuestra que el cron remoto haya ejecutado un vencimiento real.

## Estado

Código preparado para staging. No desplegado por esta modificación; producción intacta. El archivo `releases/worker-UADAVSTREAM-V11.7-11770-expiry-boundary.js` contiene el candidato completo. Conserva la recuperación real deshabilitada y el correo restringido a QA.

Pendientes: observar vencimiento automático remoto; ampliar recuperación más allá del fixture sintético con controles de elegibilidad y envío propios; validar cobro y entrega territorial antes de ofrecerlos como operativos.
