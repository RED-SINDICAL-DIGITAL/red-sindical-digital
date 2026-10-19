# Budget preview follow-up — 2026-10-15

Branch: audit/public-job-status-20261012. Production untouched.

## Changes

- Preview focuses its close control and restores focus to the originating action, including budget Ver / PDF.
- Editing dialog explains that accepting changes triggers autosave; Guardar ahora remains available.
- Existing daily-tools test suite now covers explicit print invocation, focus return, budget totals/balance, escaping and omission of private payment notes.

## Validation

Local command: node --test tests/workspace-daily-tools.test.cjs tests/artist-workspace-session.test.cjs

Result: 14 passed, 0 failed. These are script/DOM-stub tests, not browser end-to-end tests.

## Browser limitation

Opening the existing synthetic artist in staging returned 'Abrí Mis herramientas desde Mi perfil'. The remote browser did not retain the artist account session. No credentials were extracted or bypassed. Budget creation/reopening, visual PDF layout and latest authenticated Admin moderation review remain unverified. This observation alone does not establish backend session expiry.
