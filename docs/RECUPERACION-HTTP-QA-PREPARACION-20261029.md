> Etapa preparatoria histórica, reemplazada por RECUPERACION-HTTP-QA-INTEGRADA-20261029.md. El controlador ya está conectado para QA privada y sigue apagado por defecto.

# Capa HTTP QA para recuperación antigua — 29/10/2026

scripts/job-recovery-http.mjs es preparatorio, no está enrutado ni embebido en worker.js. No se requiere desplegar Worker ni activar flags ahora. Ninguna ruta operativa cambia: recuperación antigua continúa deshabilitada.

Puertas: origen API exacto de staging, Origin exacto de Pages/API, opción qa-only explícita, IDs JOB-QA- exclusivamente y correo QA configurado. POST JSON limitado a 4096 bytes con campos exactos, solicitud uniforme sin enumeración de destinatarios, no-store y sin secretos en respuestas o errores. El cliente aporta una nueva clave y el controlador entrega solo su hash al motor; el canje devuelve confirmación y revisión, no la clave. Preflight no toca almacenamiento.

46 pruebas relacionadas aprobadas: 8 de frontera HTTP, incluida composición con SQLite real; más 38 de outbox/recuperación atómica. Solicitud preserva clave vieja, despacho sintético no entrega correos, canje rota una vez, respuesta repetida confirma la misma rotación y otra clave candidata se rechaza.

Precisión sobre auditoría anterior: el motor sí está incluido en worker.js para QA privada mediante uadavLiveMailCore; el módulo fuente dice preparatorio porque no se importa directamente. Eso no equivale a integración en las rutas públicas de ofertas antiguas. Falta conectar controlador, contexto validado de esquema/migración y proveedor, receptor seguro de enlaces, límites de canje HTTP y QA real antes de habilitar cualquier uso público. Este controlador no inicia despacho de correo.

Producción, credenciales, flags y datos remotos sin cambios.
