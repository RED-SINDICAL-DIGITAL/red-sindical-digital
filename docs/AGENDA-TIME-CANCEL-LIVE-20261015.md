# Agenda editing and time display — 2026-10-15

Staging only, QA PRO INTEGRAL 1510. Production untouched.

## Observed through actual UI

- Opened persisted agenda entry and replaced Lugar with CAMBIO QUE SE CANCELA.
- Cancelled, reopened same entry: Lugar remained Sala ficticia; original date, show, status and budget-origin note remained.
- Entered Hora 18:30 and accepted. Automatic save success observed.

## Fix

The agenda table previously omitted its saved time. Added escaped time alongside date, only for agenda. Empty times do not introduce a separator; other tools preserve existing date/detail behavior.

Validation: 15 tests passed via node --test tests/workspace-daily-tools.test.cjs tests/artist-workspace-session.test.cjs. At initial deployment check, staging sourceCommit was still bf062413aa7f9b81264e56ed99ce561d7622cced, so visual confirmation of new time label was not yet complete. PDF download remains unverified in remote browser.
