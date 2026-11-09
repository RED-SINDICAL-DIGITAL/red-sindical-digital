# Reconstrucción del laboratorio sintético de correo de Bolsa

Este procedimiento es exclusivamente para la QA histórica de **11766**. No desplegar `releases/uadav-bolsa-mail-lab-11766.js` ni su ZIP como Worker de staging o producción, ni reutilizar bases reales o claves de Brevo.

## Fuentes verificadas

- `scripts/build-job-mail-lab.mjs` valida el SHA-256 del laboratorio base 11764 aprobado, construye el JS sintético y calcula huellas de los módulos de recuperación.
- `scripts/repackage-job-mail-lab.py` sustituye únicamente el `worker.js` contenido en el ZIP sintético, preservando los demás miembros, y verifica integridad.
- La rama `fix/bolsa-mail-lab-rebuild-20261107` contiene un workflow restringido que ejecuta ambos pasos y `--check`, y guarda los dos artefactos solo en esa rama.

## Revisión obligatoria

```sh
node scripts/build-job-mail-lab.mjs --check
node --check releases/uadav-bolsa-mail-lab-11766.js
```

El resultado de estas verificaciones solo acredita consistencia de archivos de QA: no demuestra un envío de correo real, migración D1, entrega por Brevo ni despliegue de la beta.
