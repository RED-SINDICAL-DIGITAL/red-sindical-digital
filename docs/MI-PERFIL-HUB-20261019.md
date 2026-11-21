# Mi perfil as the user's task hub — 2026-10-19

User asks for a complete, understandable central place to act, check progress and manage account capabilities. Avoid a primary Salir action. Closing the application and disconnecting an account from a shared device are different operations.

## Implemented
- Mi perfil document title and guest display heading are consistent. Personal name still appears when supplied voluntarily.
- Mis gestiones includes Consultar mi postulación, Publicar un evento, Publicar una oportunidad and Contratar artistas, plus public help. Application tracking explicitly requires the existing private receipt; no account ownership inference or key storage was added.
- Linked artist cards expose Editar perfil de artista and Consultas recibidas directly. Inquiry opening still requests a session for that exact artist, with duplicate/current-account guards. PRO, unlinking and deletion remain under Más opciones.
- Legacy validated artist access also receives a direct Consultas recibidas link; hidden/reset state follows artist/account changes.
- Radio Studio entry remains conditional on verified station authorization. Notices, library/history, profile editing, devices and recovery remain available.
- Shortened repeated artist marketing explanations and removed discovery links duplicated across the library panel/menu.
- Avatar is keyboard-operable and has an accessible label.
- Existing advanced Cerrar cuenta en este dispositivo label changed to Desvincular este dispositivo. No new exit button, credential flow, server revocation or deletion behavior was introduced. Existing confirmation/disconnect semantics are unchanged.

## Validation
19 existing private artist-opening/profile-edit tests passed. Updated artist menu integration verifies prominent consultations and PRO both use the exact artist session. Its synthetic session fixture was corrected to match the current validated response contract (matching artist_id and ART token); validation was not weakened. Inline profile syntax passed.

Changes affect frontend only. No live grants, account links, personal submissions, production or payment changes. New Pages deployment and visual/fragment navigation verification remain pending; authenticated owner and physical mobile/TV acceptance are separate gates.
