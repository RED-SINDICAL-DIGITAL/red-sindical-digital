# Bolsa 11762 · captura por URL aprobada en staging · 25/10/2026

## Código y despliegue

El usuario confirmó el despliegue. Health observado en navegador el `2026-10-25T21:30:31.284Z` (18:30 de Argentina): **11762**, D1/KV disponibles, correo y cola apagados. El código principal sigue en `a98be118050af80c3325c1a7f01f3ee966b6c747`, SHA256 `94e6603f4f9d44f6cfaa6f152c4670f27335ef9fdd7c52e90c3985b4ecdaab98`. Pages sigue en `e90f40a8b80d25bbaf8e1722d5b9a1d27884632c`. No hizo falta pedir de nuevo la clave Admin: el acceso se restableció al completar la carga.

## Prueba real completada

1. El catálogo mostró las cinco ofertas originales antes de la prueba.
2. En Fuentes automáticas → Agregar una ficha puntual → Bolsa se revisó `https://uadav-stream-staging.pages.dev/tests/staging-job-source`. El error de 11761 ya no ocurrió: se leyeron título, descripción con acentos, Rosario y plazo **2026-11-24**.
3. Se editó el título a **QA 11762 · Captura por enlace · NO CONTRATAR** y se confirmó una ficha. Registro creado: **`JOB-EXT-93C1A556`**.
4. El catálogo pasó a seis ofertas. La nueva ficha mostró **Convocatoria externa** y **Ver convocatoria**. Su botón abrió la página ficticia correcta en otra pestaña; no abrió una postulación interna.
5. Se repitió la captura y confirmación de la misma URL con el mismo título. El catálogo siguió en seis y había una sola ficha con ese título.
6. Desde Admin se ocultó únicamente esa ficha de QA.
7. Se repitió otra vez usando la URL con `#repeticion`. La identidad persistida quedó sin fragmento, el mismo registro se actualizó y siguió **oculto**. No volvió a publicarse.
8. El catálogo volvió a cinco ofertas y la ficha de QA dejó de aparecer. Admin mostró **12 ofertas totales, 10 postulaciones**, con una sola coincidencia del nuevo título, en estado **Oculta**.

[Evidencia final en Admin](evidence/bolsa-11762-captura-oculta-verificada-20261025.jpg). No se borraron registros ni se alteraron ofertas anteriores.

## Respaldo posterior y cotejo

Se usó **Generar respaldo y revisar**. La herramienta confirmó `already-d1`: 12 ofertas, 10 postulaciones, origen D1, tablas requeridas presentes y respaldo actual consistente. No se volvió a ejecutar la migración ni se cambiaron flags.

Respaldo privado actualizado como **versión 4 del mismo archivo**, conservando las versiones anteriores. El nombre histórico del archivo sigue indicando 11759; su contenido observado es build **11762**.

- Tamaño: **262907 bytes**.
- SHA256: `699d2fc97626d0b7562043626f8655d9cb3293dc118b42d9d6f829f4d0db7968`.
- **22 registros D1**: 12 ofertas y 10 postulaciones.
- **6 credenciales, 3 vínculos y 1 marca de aviso**, sin cambios respecto de la versión 3.
- Los **21 registros anteriores** coinciden campo por campo con el respaldo previo. La única oferta nueva es la ficha de QA oculta. No se creó una candidatura.
- Los cinco IDs públicos son los mismos: `JOB-MVF8XT4Q`, `JOB-MVK4UKQB`, `JOB-MVK5L2S6`, `JOB-MVKBI1LC`, `JOB-MVKC9GCK`.
- `source_url`, `application_url` y el `request_id` de la ficha corresponden a la misma URL canónica, con una sola coincidencia. Se cotejó la proyección KV del export con sus filas D1 y credenciales.

Ese nuevo archivo también pasó el ensayo `scripts/rehearse-job-restore.mjs` en SQLite en memoria: cotejo completo, repetición sin duplicados, fallo con rollback y reintento correcto. Esto sigue siendo prueba local del respaldo, no recuperación remota de toda la base.

El JSON privado no está en git. No se habilitaron recuperación por correo, restauración en la base actual, cron o producción.

## Continuidad

La captura puntual con fuente sintética propia queda validada. Siguen pendientes las fuentes reales autorizadas y la salida pública controlada frente a rebinding, el correo transaccional, la restauración remota desechable, avisos vencidos/cron, cuentas y concurrencia independientes y dispositivos restantes. No declarar terminada Bolsa ni pasar todavía a Cartelera.

Se preparó un **Worker independiente de ensayo**, sin tocar `worker.js`, para ejecutar las rutas exactas de restauración sobre una D1 nueva y solo con fixtures. Ver `BOLSA-11762-RESTAURACION-D1-DESECHABLE.md`. No reemplaza el Worker principal y su despliegue remoto queda pendiente de la creación manual de esos recursos QA.

## Código guardado y CI confirmada

Commit del adaptador y del registro de captura: [`37e1cfb`](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/commit/37e1cfbd9c10c7a8800d4a38b0b4b3ada0623f64), únicamente en `release/radio-studio-staging-rc-20261020`.

- [Bolsa staging policy checks · 40238857214](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40238857214): **success**; fuente generada, políticas, 65 pruebas focalizadas, 12 comprobaciones workerd y compatibilidad KV aprobadas.
- [Radio Studio security checks · 40238857246](https://github.com/RED-SINDICAL-DIGITAL/red-sindical-digital/actions/runs/40238857246): **success**.

Estos resultados prueban el código guardado. El Worker `uadav-restore-qa` y la D1 `uadav-bolsa-restore-qa` **todavía no están creados, vinculados ni desplegados por esta sesión**. La prueba D1 remota sigue pendiente. El Worker principal 11762, Pages, producción y la recuperación por correo no cambiaron.
