# Revisión de anchos · Cartelera y Bolsa · 28/10/2026

Herramienta existente del repositorio adaptada y publicada como /qa-responsive-staging, exclusiva del hostname uadav-stream-staging.pages.dev. Commit de herramienta: d5b1cbc0eb193e921bd52f81db5a7b27e9a170f6. No es emulación de hardware ni validación táctil. No carga Admin, no recopila claves ni escribe en la API por sí misma. La aplicación contenida sigue siendo interactiva; la página indica no enviar formularios durante la inspección.

Se verificó mediante navegador de Work que carga la aplicación real de staging en contenedores de 320, 390 y 430 px. El contenido útil interior medido fue 303, 373 y 413 px respectivamente por bordes y barras de desplazamiento del navegador de escritorio. No se confunden estas medidas con el viewport de un teléfono real.

| Pantalla | Contenedor 320: scroll/viewport | Contenedor 390 | Contenedor 430 |
|---|---|---|---|
| Cartelera | 303/303 | 373/373 | 413/413 |
| Ficha Teatro Colón | 303/303 | 373/373 | 413/413 |
| Publicar evento | 303/303 | 373/373 | 413/413 |
| Bolsa | 303/303 | 373/373 | 413/413 |

En las cuatro pantallas, scrollWidth igual a clientWidth: no se detectó desbordamiento horizontal. La navegación inferior se observó visible. La ficha mantuvo título, afiche, información y acciones. No se modificaron sus estilos porque no se comprobó un defecto que justificara hacerlo.

Postulación de Bolsa, abierta y cancelada sin enviar: ancho exterior 279/349/389 px, siempre dentro del contenido disponible; scrollWidth y clientWidth del diálogo iguales (262/332/372 px). Alto 694 px dentro de un viewport vertical de 730 px, con desplazamiento propio. No se escribieron datos personales ni se marcaron consentimientos.

Búsqueda de Cartelera «Colón»: 1 evento; Limpiar filtros: 2 eventos. Búsqueda de Bolsa «Teatro Colón»: 1 oportunidad, la convocatoria oficial; Limpiar filtros: 3 oportunidades. La búsqueda de Bolsa incluye carga asíncrona, y se esperó su resultado visible antes de comprobarlo. No hubo publicaciones, postulaciones, pagos ni correos durante esta revisión.

Límites pendientes: teléfono físico, teclado virtual, tacto, orientación y áreas seguras reales. No se certifica reproducción real ni toda la plataforma por comprobar estas pantallas. Suite de interfaz anterior vigente: 671/671 aprobadas. Producción y Worker no se modificaron.
