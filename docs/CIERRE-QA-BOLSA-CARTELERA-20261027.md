# Pasada consolidada: Bolsa y Cartelera

## Evidencia comprobada

- 398 pruebas Node del Worker aprobadas (`node --test tests/*.test.mjs`).
- 173 pruebas de interfaz de Bolsa, Cartelera, Admin, importación, modelo comercial y territorios aprobadas. Incluyen doble clic, fallo de respuesta, conservación del formulario y respuesta tardía después de navegar.
- Staging consultado sin escrituras: health 200, build 11769, KV/D1 disponibles; Cartelera 200 con 2 eventos; Bolsa 200 con 3 ofertas públicas.
- La ruta advertising/policy todavía devuelve 401 en el Worker desplegado: las funciones nuevas no están desplegadas. El código nuevo se identifica como build 11770 para evitar confundirlo con el operativo.

## Correcciones de esta pasada

1. Admin bloquea doble guardado, conserva el formulario ante respuesta incierta y no anuncia éxito ante identidad incompleta o error D1. Un éxito tardío no cierra otro formulario ni cambia una sección diferente.
2. Creación administrativa experimental: intención y evento D1 con una referencia única, reenvío idéntico sin duplicado y conflicto si cambia el contenido. Crear no confirma un destacado pago; primero se publica y después se revisa el pago.
3. Migración puntual de un evento heredado al editar/eliminar: INSERT OR IGNORE conserva cualquier fila canónica más nueva; historial y cambio posteriores siguen transaccionales.
4. El modo canónico impide sustituir colecciones enteras mediante endpoints antiguos.
5. Comprobación de publicación por referencia: devuelve solamente confirmación e ID público, nunca datos de contacto; no publica ni reenvía el formulario. Si el servidor anterior no la admite, el formulario sigue conservado y bloqueado contra duplicados.
6. Campaña nacional disponible para un anunciante de cualquier provincia. La provincia del anunciante no restringe su selección de alcance; la pauta provincial sí restringe su público destinatario.
7. Navegación comercial del Admin depende de Publicidad, no de la membresía retirada.

## Estado y próximos pasos concretos

Bolsa: sin fallos nuevos detectados en esta revisión. Se conservan las evidencias operativas previas de D1, concurrencia, consentimiento, privacidad, vencimiento, backup y restauración aislada. No se reejecutaron pruebas con correos reales ni restauraciones remotas ni se habilitó recuperación histórica por clave de oferta.

Cartelera: código experimental más completo, pero NO terminada operativamente. Siguen siendo bloqueantes la entrega/reintento real de avisos, cobertura de importación y mantenimiento respecto al catálogo canónico, respaldo/restauración de referencias de publicación, y validación del circuito en D1 real aislado antes de activar EVENT_ATOMIC_STAGING. La comprobación por referencia solo opera cuando ese circuito está activado y desplegado.

No activar el flag, no modificar producción ni presentar las pruebas locales como una certificación de entrega en Cloudflare. El build 11770 queda como código candidato, no como despliegue autorizado ni como cierre operativo total. No hace falta repetir las pruebas de Bolsa ya documentadas sin un cambio, fallo o riesgo nuevo.
