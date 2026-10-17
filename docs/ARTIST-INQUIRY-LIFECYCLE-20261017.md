# Artist inquiry lifecycle — 2026-10-17

Existing audit branch only; frontend repair. No Worker, permissions, payments, messages, public publication or production configuration changes.

## Findings

Inbox mounting registered account/storage listeners for each render, without explicitly disposing the prior same-host mount. Requests and detached row references could outlive tab replacement, and a malformed item list could replace the valid cached list before rendering failed. Source inspection identified these cases; no claim of observed production data exposure.

## Changes

WeakMap tracks one mount per host. Remount cancels the previous lifecycle and pending fetch. A direct-child observer detects section replacement; detached-host checks also dispose on delayed completion. Disposal clears retained item state, removes account listeners, aborts pending requests and disconnects observer. All render/update paths verify the current DOM mount and account. Existing owner-pinned requester remains unchanged.

Refresh validates item objects, string identifiers and supported states before replacing the prior list. Missing state defaults to Nueva/pendiente; incomplete refresh preserves the previous list and filters, explains retry and enables Actualizar. Duplicate refresh clicks remain serialized. A failed status PATCH restores the prior selection; successful PATCH only changes stored status, never sends messages.

## Validation

Syntax passed. 13 local VM tests passed: seven full-module DOM/fetch lifecycle cases, three account isolation checks and three artist session renewal checks. Full-module cases cover remount/stale result, section exit, detached host, malformed refresh, duplicate refresh/network failure, failed/successful status save, account switch cleanup. Actual Worker + SQLite integration passed for free inquiry delivery, recipient-only private access, persisted states, invalid state rejection and active-owner/suspension safeguards.

Manual updated. Full GitHub CI and live authenticated browser validation of this frontend revision remain pending. No test-only account was created; prior cloud browser private session is unavailable. Do not describe the new UI lifecycle as end-to-end verified until reopening a linked account and exercising its inbox.
