# Carga editorial y descubrimiento — 2026-11-04
Entorno exclusivo: staging. Producción sin modificaciones.

## Código y validación
Pages commit: 39e0d29092b1ef2d357fc4dfe52625372ffac76b.
796 pruebas de interfaz aprobadas, cero fallos. Checks ui-and-isolation y Cloudflare Pages aprobados.
Se excluyen perfiles sin identidad navegable; estados catalogo/aprobado admitidos únicamente para perfiles públicos, manteniendo restricciones de privacidad. En vivo respeta estados ocultos y flags de visibilidad.

## Operaciones reales de Admin
Importación de tres perfiles editoriales: Les Luthiers, Soledad Pastorutti y Cirque du Soleil. Resultado creado=3, actualizado=0, sincronización D1 aprobada. Fuentes: canales oficiales públicos. Sin atribuir afiliación, propiedad o contratación paga.
Actualización de radio existente Beat Digital Radio: creado=0, actualizado=1, sincronización D1 aprobada. Fuente https://beatdigital.com.ar/radiobeat; stream canónico https://stream.zeno.fm/9s7nnwmknkhvv. Sin pauta ni destacado pago.
Creación de señal Beat TV desde https://beatdigital.com.ar/beattv, video VWhQ6xspnSc. Visible, no principal.
Dos radios y dos señales TV sintéticas con dominios example.invalid quedaron ocultas, conservando sus registros.

## Verificación en navegador tras despliegue
Directorio: cuatro perfiles reales navegables, sin ficha genérica vacía.
Explorar: aparecen los tres perfiles editoriales nuevos y Beat Digital.
Soledad y Les Luthiers: identidad correcta, imagen y videos cargados.
En vivo: Beat Digital Radio y Beat TV visibles; no aparecen cuatro registros QA ocultos.
La detección automática de transmisiones y canales vinculados devolvió errores de fuente, mientras radio y señal configuradas siguieron disponibles. No se considera resuelto ni se atribuye causa sin diagnóstico.
No se verificó reproducción audible de Beat ni reproducción efectiva de Beat TV. Una URL configurada y visible no acredita emisión en curso.
Sin cambios ni despliegue de Worker en esta pasada.

Captura: evidencia/perfil-editorial-20261104.jpg.
