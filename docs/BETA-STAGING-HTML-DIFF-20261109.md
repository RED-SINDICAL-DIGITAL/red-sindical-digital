# Conciliación funcional de HTML — 2026-11-09

## Orígenes confirmados por capturas Cloudflare del usuario

- Proyecto Pages `uadav-stream-staging`, deployment principal de entorno **Production dentro del proyecto staging**: rama `audit/continuidad-demo-20261019`, commit visible `0b82dcf`. No confundir esta etiqueta de Cloudflare con el dominio de producción real de UADAV.
- Deployment Preview beta ID `655d85c5-fc44-42f9-be56-837534d7a96b`, alias `feat-beta-staging-profile-20.uadav-stream-staging.pages.dev`, status success, commit `be52843`.
- Deployments automáticos habilitados. Un push a la rama fuente principal puede publicar automáticamente: no modificarla hasta cerrar QA.

## Comparación de fuentes desde GitHub (lectura)

| Archivo | Blob staging principal | Blob beta | Longitud staging / beta |
| --- | --- | --- | --- |
| `usuario.html` | `e1ec5f10ecd717d221213aeaba640242e4277934` | `388ff8a66145f63a1bb3b8f1bcb7f2208441fca8` | 112792 / 72777 |
| `app.html` | `1ec6f3902b29bc5dc75aaaf0ff5141449785b77b` | `1a30bd67c2d588defd48a30ef341256f11694cf0` | 51094 / 44558 |
| `uadav-api-config.js` | `e930d9f8c6812b20b05ad414d381a42b6cd3985a` | `337702601d9d8b25f061b3ef2584069936a1acaa` | 5508 / 5503 |

### Staging-only DOM / integrations to preserve and validate

`usuario.html` includes IDs missing in beta:
- `profileJobsTabApplications`, `profileJobsTabOffers`, `profileJobsApplications`, `profileJobsOffers`.
- `profileOwnedEventEditor`, `profileOwnedEventForm`, `profileOwnedEventSave`, `profileOwnedEventsList`, `profileOwnedEventsRefresh`.
- `profileLocalEvents`, `profileLocalEventsList`, `profileOwnerEventsScript`, `profileJobsTabsScript`.
- External `/uadav-event-local-receipts.js?v=20261107` is loaded in main staging but not beta.

`app.html` includes IDs missing in beta: `mediaOptions`, `mediaSecondaryActions`, `uadavInstallApp`.
Staging-only JS resource references include `/uadav-personal-playlist.js?v=20261104-selection`, `/uadav-account-sync.js?v=20261104-library-events`, `/uadav-playlist-player-v136.js?v=20261104-queue-controls`, `/uadav-native-media-session.js?v=20261104-queue-controls`, `/uadav-video-feedback-v151.js?v=20261030-system-controls`. Beta has older asset query revisions. Query revision alone is not proof of changed code, but must be verified.

### Mandatory safe integration

1. Treat staging main HTML as baseline for preserved functionality; add reviewed beta UI changes incrementally on a **new integration branch**, not on the automatic deployment branch.
2. Confirm scripts, DOM controls and their event listeners, editing/ownership permissions, playlist session handling and install affordances work after merge.
3. Preserve beta staging-only API guard, never permit previews to fall back to production.
4. Test Chromium at mobile/desktop widths plus actual authenticated QA sessions (synthetic staging accounts); verify events, jobs, library, playback.
5. Only after explicit review, promote candidate to staging with rollback prepared. Do not touch actual production.

**This analysis used GitHub repository sources and user-provided Cloudflare screenshots; it was not a live browser session or a deployment.**
