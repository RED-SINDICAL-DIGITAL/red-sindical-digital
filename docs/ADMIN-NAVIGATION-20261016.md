# Admin section navigation — 2026-10-16

Admin previously always loaded dashboard after authentication/reload. Added validated section query parameter, history push for section changes, replace for refresh/same section, and popstate handling. Unknown/inherited/non-function views fall back to dashboard. Only a view name is added to URLs; credentials and record payloads remain out of navigation state. Signed-out popstate does not invoke private views.

Validation:
- Three Node regression tests passed; added tests/admin-navigation.test.cjs to existing platform CI.
- Deployed public staging inline scripts passed node --check.
- Authenticated actual staging: entered Consultas y comunidad, reloaded, returned to same section with saved inquiry; moved to Pendientes, browser Back returned to Consultas, Forward returned to Pendientes with 8 records.

Limits: tested completed view loads, not rapid overlapping asynchronous loads, open edit forms/modals, browser cache eviction or physical mobile/TV hardware. Search values and modal drafts are not persisted by this change. No Worker, billing, credentials or production change.
