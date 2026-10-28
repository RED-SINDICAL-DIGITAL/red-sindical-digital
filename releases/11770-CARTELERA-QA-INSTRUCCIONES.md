# Cartelera 11770 · validación real en D1 aislado

Estado: paquete probado localmente; **no desplegado y sin recepción real comprobada todavía**. La sesión Google de Cloudflare fue rechazada desde Work; la instalación debe hacerse en el panel del operador. No es un cambio al Worker de staging que ya está funcionando.

## Preparación en Cloudflare

1. Crear una **D1 nueva y vacía** llamada `uadav-cartelera-qa-11770`. No seleccionar una base de staging, producción ni la base del ensayo de restauración anterior.
2. Crear un **Worker nuevo** llamado `uadav-cartelera-qa-11770`. Si ese nombre ya existe y contiene otro trabajo, no reemplazarlo sin revisarlo. Su dominio previsto es `uadav-cartelera-qa-11770.uadavstream.workers.dev`.
3. Cargar el archivo completo **`uadav-cartelera-qa-11770.js`**. No usar el archivo `worker-UADAVSTREAM-V11.7-11770.js`, que pertenece al staging operativo.
4. En Bindings, añadir **D1 database**, variable **`DB`**, apuntando exclusivamente a la D1 nueva. No añadir bindings de KV, servicios operativos ni cron.
5. En Variables and Secrets, añadir:

| Nombre | Tipo | Valor |
| --- | --- | --- |
| `CARTELERA_QA_ONLY` | Texto | `true` |
| `CARTELERA_QA_KEY` | Secret | Una clave nueva de prueba de al menos 32 caracteres aleatorios, guardada por el operador. No usar la clave productiva ni pegarla en el chat. |
| `BREVO_API_KEY` | Secret | La clave de Brevo que el operador tiene guardada, introducida directamente en Cloudflare. No enviarla por chat ni intentar leer secretos enmascarados. |
| `BREVO_QA_RECIPIENT` | Secret | El correo propio destinado a recibir el aviso de QA. No usar una dirección de terceros. |

Las dos variables de Brevo pueden agregarse después de aprobar las fases D1. La fase sintética no envía correos. No se requiere habilitar `EVENT_ATOMIC_STAGING` ni cambiar variables del Worker operativo.

6. Desplegar el nuevo Worker. Abrir su `/health`: debe mostrar `version:11770-cartelera-qa-1`, `enabled:true`, `database_bound:true` y `operational_routes_exposed:false`.

## Ejecutar la prueba

Abrir la raíz del nuevo Worker, ingresar la clave de prueba y pulsar **Validar circuito ficticio**. Se ejecutan tres fases:

1. Publicación pública concurrente, referencia única, conflicto y Admin.
2. Importación repetida, eliminación sin reactivación, destacado pago y vencimiento.
3. Respaldo y restauración descartable en D1, rollback y reintento; un envío interrumpido se restaura como incierto y no se reenvía automáticamente.

Tras aprobar D1, marcar la autorización y pulsar **Enviar un aviso real**. Solamente puede enviarse al correo definido en `BREVO_QA_RECIPIENT`. El asunto comienza por **Cartelera · QA Cartelera 11770** y el remitente usa `acceso@correo-staging.uadavstream.com.ar`.

Después de recibir y abrir ese aviso (bandeja de entrada o spam), marcar la confirmación y pulsar **Confirmar recepción**. La aceptación de Brevo queda separada de la recepción confirmada por el operador. No marcar recibido antes de verlo.

Pulsar **Copiar resultado** y compartir únicamente ese JSON seguro. No incluye claves, dirección de correo ni contenido privado.

## Si se corta la respuesta

Usar **Consultar resultado** antes de repetir. Las fases confirmadas no se ejecutan de nuevo; las publicaciones y avisos conservan la misma referencia. Un envío incierto no se repite a ciegas. El laboratorio no tiene cron ni endpoint de borrado.

- `QA_FOREIGN_DATABASE` o `QA_UNOWNED_DATABASE`: la base no es exclusiva y vacía para este ensayo. No borrar ni renombrar datos para forzarla; seleccionar una D1 nueva.
- `QA_CONFIGURATION`: falta el binding DB, la variable de activación o una clave de prueba de al menos 32 caracteres.
- `QA_MAIL_CONFIGURATION`: falta un secreto de correo válido en este Worker nuevo. No cambia ni borra los secretos del staging operativo.
- `QA_RUNNING`: hay una prueba en curso. Consultar; no abrir ejecuciones paralelas.

El guardia permite únicamente las tablas del laboratorio y la tabla reservada `_cf_KV` de D1, sin leer ni modificar su contenido. Referencia: https://developers.cloudflare.com/d1/best-practices/import-export-data/

## Qué valida y qué no

El laboratorio contiene el código exacto del Worker operativo 11770, cuyo SHA-256 figura en `/health` y en el manifiesto. Lo ejecuta contra tablas ficticias prefijadas dentro de la D1 exclusiva; no realiza peticiones de red a la API de staging ni a producción. Las únicas peticiones externas previstas son el aviso autorizado a Brevo. No publica ofertas ni eventos en la plataforma real, ni modifica Bolsa, ni activa el circuito de Cartelera en staging.

El resultado real de D1 y recepción aún está pendiente de ejecución. Los resultados locales y el proveedor simulado no se presentan como pruebas remotas.
