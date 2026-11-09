# UADAV STREAM — conciliación de ramas y bloqueo de publicación (2026-11-09)

## Estado verificado vía GitHub

- Repositorio: `RED-SINDICAL-DIGITAL/red-sindical-digital`.
- Candidato combinado: `feat/beta-staging-profile-20261108` en `531eeb7f4e2894eda1c93a9af80725034e8b7900`.
- PR #52: abierto, draft, no fusionado. Base: `release/beta-staging-candidate-20261108` (PR #51 también abierto/draft).
- PR #53: fusionado exclusivamente hacia la rama beta, sin paso a producción.
- En el commit indicado, seis workflows GitHub Actions reportan `completed/success`: Bolsa staging policy, Beta staging candidate, Event owner staging, Job status contract, Platform integration y Beta native Mi Perfil.
- Comparación de la rama histórica `audit/continuidad-demo-20261019` con el candidato beta: `diverged`, 370 commits ahead y 360 behind. **No fusionar automáticamente**.
- Comparación del candidato base `release/beta-staging-candidate-20261108` contra beta: 108 commits ahead, 0 behind.
- La rama beta conserva redirección explícita de API de vistas previas `*.uadav-stream-staging.pages.dev` al Worker staging en `uadav-api-config.js`.

## Bloqueo de despliegue confirmado por el checkpoint anterior

`docs/BETA-STAGING-RELEASE-GATE-20261108.md` documenta un GET público realizado por CI: Pages principal staging sirve HTML distinto del candidato GitHub (Mi Perfil publicado: 112944 caracteres vs. 69049 en candidato; app publicada: 51270 vs. 43544). El Worker publicado reportaba build 11770, KV/D1 OK, `event_owner_revision=20261107-owner-verified-v1`.

**No reemplazar Pages staging, ni publicar Worker, ni fusionar con main** hasta identificar en Cloudflare el deployment y commit que alimenta `uadav-stream-staging` y conciliar las diferencias de archivos. Esa medición es histórica y debe repetirse antes de la aprobación del despliegue.

## Secuencia segura para continuar

1. Cloudflare Pages → proyecto `uadav-stream-staging` → Deployments: registrar deployment ID, rama, commit SHA, fecha y tipo (Git/direct upload) del deployment activo. Registrar también las variables de entorno sin copiar secretos.
2. Recuperar artefacto o árbol exacto de esa publicación y comparar `usuario.html`, `app.html`, CSS/JS de Mi Perfil, `uadav-api-config.js`, rutas, service worker y manifest con PR #52. Conservar funcionalidades exclusivas de cada lado.
3. Auditoría del Worker: confirmar nombre exacto del Worker staging y revisión desplegada; comparar sin sobrescribir sus bindings KV/D1 ni secretos. No usar ZIP sintéticos como Worker.
4. Crear rama de conciliación a partir del candidato beta (no de producción); trasladar solo diferencias revisadas. Ejecutar pruebas automáticas y QA visual real móvil/escritorio, navegación, login/recuperación por correo, postulación, publicación de eventos, Admin autenticado, Radio Studio y player.
5. Verificar exportación/restauración de datos sintéticos y plan de rollback; entonces pedir aprobación explícita de publicación en **staging**.

## Alcance de este checkpoint

Se hicieron consultas de lectura a GitHub y se registra el diagnóstico. **No hay evidencia nueva de un deployment ni QA visual interactivo en Cloudflare en este paso.** Ninguna base, Worker, dominio de producción, pago o credencial fue modificado.
