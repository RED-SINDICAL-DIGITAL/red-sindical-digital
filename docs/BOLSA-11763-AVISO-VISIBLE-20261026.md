# Bolsa 11763 · aviso visible en PC confirmado · 26/10/2026

El usuario confirmó **aviso visible** y adjuntó una captura de Mi Perfil staging. La imagen se inspeccionó directamente. Muestra **Mis avisos**, dos avisos nuevos y estos títulos:

- **Una de tus ofertas está por vencer**, con fecha límite **2026-10-26** y texto para abrir Mis trabajos.
- **Tu oferta recibió una postulación**, con texto para consultar los datos autorizados.

Son dos hechos distintos, coherentes con la oferta JOB-MVPJ9WRW-439D4126D9AE y la candidatura POST-MVPJCNGX-E7683EC0 ya cotejadas. La generación automática de las 14:45 y el siguiente turno de las 15:00 sin repetición están aprobados en el registro anterior. **Visualización en el dispositivo destinatario: aprobada en PC.** Esto no implica marcado como leído, prueba en todos los dispositivos o rechazo remoto entre dos cuentas autenticadas.

La captura original permanece como archivo privado aportado por el usuario; no se copia al repositorio. SHA256: 2e6350b1d89c997cd7a1f4850b75a1c6e6a02322ea5363396c1e26255cd10ddc, 462591 bytes. El registro público describe únicamente el contenido necesario de la prueba.

## Ajuste de hora detectado

La captura muestra **02:45:40** y **02:33:40** sin una indicación de mañana/tarde. El componente usaba toLocaleString con la configuración implícita de zona y ciclo horario. Se fijaron Argentina y 24 horas, manteniendo fecha completa y segundos, y se agregó la aclaración **hora argentina**.

Código Pages **7e16b2a815a218df870d7375ae565af6893afa70**, recurso **11763.3**, CI **40376703081: success**. Aprobaron 138 pruebas UI de Bolsa, el control existente de avisos entre cuentas, importación/exportación, sintaxis y diff. Con Node en zona de Honolulu se comprobó 17:45Z → 14:45:40 y 03:00Z → 00:00:00 de Argentina. La vista publicada de usuario referencia el nuevo recurso; no se da por nuevamente observada la representación corregida en el dispositivo del usuario.

El cambio afecta solo la presentación y caché del frontend, más su cobertura en CI. Se conserva el transporte y control de cuenta. No requiere otro Worker ni una intervención en Cloudflare. El respaldo privado versión 5 sigue siendo la copia verificada de las 14:47, 13 ofertas y 11 postulaciones; no se generó otra copia solo por esta confirmación visual.

## Próxima comprobación real

Mantener la oferta con su fecha actual. Desde el **27/10/2026 a las 00:00 de Argentina**, **03:00Z**, comprobar vencimiento, retirada del catálogo, rechazo del servidor a postulaciones nuevas, cierre programado, candidatura previa preservada y un aviso posterior único. No simular el cambio de día. Ver BOLSA-11763-QA-VENCIMIENTO-REAL.md y el estado general de cierre.

Bolsa sigue pendiente por ese ensayo y las otras puertas registradas. Producción, recuperación por correo y restauración operativa mantienen sus límites.
