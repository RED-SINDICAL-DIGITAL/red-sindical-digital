# Cartelera: publicación y ficha — 18/10/2026

Rama: audit/public-job-status-20261012. Producción y cobros reales sin cambios.

## Correcciones
- Publicación serializada en el formulario, sin repetición automática de POST contra otra API.
- Se conserva el borrador al fallar; una respuesta incompleta no se anuncia como publicación.
- Se distinguen publicación común, revisión de contenido y solicitud comercial de destacado sin pagar.
- Un envío confirmado queda bloqueado hasta elegir Publicar otro evento.
- Fecha y hora principales se incluyen en funciones para conservarlas en el Worker existente.
- Se comprueba que cuenta y acceso de artista no cambien durante la preparación del envío.
- La ficha exige coincidencia del identificador solicitado; no presenta otro evento recibido por error.
- Botones externos admiten HTTP/HTTPS sin credenciales incrustadas y usan noopener noreferrer.

## Evidencia
- 13 pruebas del formulario y 6 de identidad/enlaces de la ficha: satisfactorias.
- Con regresión de Bolsa: 41 pruebas satisfactorias.
- Integración aislada del Worker existente con SQLite/D1 y KV simulado: publicación gratuita, catálogo, ficha, horario, destacado no pagado, rechazo del destacado conservando ficha común, autorización administrativa, moderación pendiente, aprobación y rechazo: satisfactoria.
- GitHub Actions del commit 20bfa27cb40318ee2724c37fcdb84b4b9e76be6e:
  - Platform integration checks 39150233715: success.
  - Job status contract checks 39150233691: success.
- Chrome en staging: formulario nuevo servido dentro de la aplicación; campos etiquetados y validación nativa del título vacío comprobados. No se envió ningún evento remoto ni se aceptó la declaración de publicación.

## Límites y siguiente cierre
La integración aislada no certifica D1/KV remotos ni concurrencia distribuida. El bloqueo del formulario no constituye idempotencia del servidor ante reintentos manuales o dos dispositivos.
Falta completar publicación/ficha/retroceso en navegador contra staging con datos acordados y probar móvil/tablet/TV. Falta también el cierre de la sesión real del artista y Press Kit público, reproducción persistente y revisión multidispositivo del plan de demo.
No se migraron horarios antiguos ya perdidos ni se modificó el Worker.
No se activaron pagos; solicitar un destacado no lo habilita como pagado.
