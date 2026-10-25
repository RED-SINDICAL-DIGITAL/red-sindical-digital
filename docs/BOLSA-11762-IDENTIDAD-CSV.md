# Bolsa 11762 · enlaces e identidad de planillas · staging

Rama Pages `audit/continuidad-demo-20261019`; Worker separado en `release/radio-studio-staging-rc-20261020`. Solo staging.

- La revisión de enlaces exige health **11762 o posterior**, porque 11761 rechaza la opción de redirección usada por su consulta DNS. La carga CSV sigue disponible mientras se despliega la corrección manual.
- Planillas y enlace puntual normalizan dominio, punto final del dominio y fragmento igual que el Worker. Conservan mayúsculas de ruta y consulta. Dos publicaciones que solo difieren en esas letras ya no se rechazan como duplicadas por el frontend. Repetir la misma URL sí se rechaza durante la revisión completa, incluso entre hojas.
- Un dominio con etiquetas inválidas se rechaza antes de cualquier consulta o importación. La URL de postulación recibe el mismo control.
- Admin carga el helper con versión de caché `11762.1`; la ayuda interna identifica el build requerido. La guía pública añade la fecha límite y aclara qué ocurre al abrir una convocatoria externa.

Pruebas focalizadas locales: **134**, más importación/exportación. Dos grupos nuevos comprueban identidad sensible a mayúsculas y etiquetas de dominio inválidas; los casos de health incluyen 11761 como insuficiente. El resto de pruebas mantiene revisión, borradores, doble envío, navegación, cuenta y aislamiento staging.

El frontend publicado no prueba por sí solo que 11762 esté desplegado en el Worker o que la captura haya aprobado QA remota. La guía y la entrega del Worker distinguen esos estados. No se habilita correo, restauración, cron ni producción.
