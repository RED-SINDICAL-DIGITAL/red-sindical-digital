# Public booking form — 2026-10-15

Staging branch only; no production deployment or public artist publication.

Associated all ten visible data fields with their labels through stable ids/for attributes. Cancel returns to the recipient artist profile when an id exists, otherwise to Artistas. Opening without recipient disables submission and displays a clear instruction; submit handler also rejects a missing recipient before building or sending payload.

Validation: node --test tests/booking-form-retry.test.cjs — 3 passed. Existing idempotent request handling retained. Live full submission-to-inbox is still pending because the available synthetic artist is private; no profile was published to enable the test. Binding acceptance, external messages and real client data were not used.
