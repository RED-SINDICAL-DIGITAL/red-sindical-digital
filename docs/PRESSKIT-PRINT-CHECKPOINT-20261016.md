# Press Kit print and privacy checkpoint — 2026-10-16

Existing renderer reviewed from audit branch; same renderer serves private preview and public presentation.

## Changes
- Before print, open only currently collapsed technical requirement details inside .kit-document. After print, restore only those still connected. Repeated beforeprint does not lose restoration state. No automatic print/export or publication.
- Final print media rule fixes portrait dimensions at120px, overriding later responsive photo rules.
- Mi perfil deletion summary now explains all-device sign-out, artist deletion/transfer prerequisite, irreversible personal-data loss and ability to create a new account. Existing server guard and confirmation dialog retained.

## Tests
11 Node tests passed:5 new renderer/print cases and6 existing quote/agenda daily workflow cases. New cases prove only explicit public kit/show fields are rendered; private notes/prices/clients/agenda/leads excluded even if present in input; hidden sections omitted; unsafe URLs rejected and text escaped; print opens/restores collapsed sections and handles repeated events/removed previews. Existing quote preview test proves internal payment notes excluded. CI includes new test.

No current account credentials available in cloud browser; actual browser PDF generation, paper pagination, screen-reader details behavior and physical-device appearance still require verification. Do not claim PDF export visually certified from VM tests. No Worker change, production deployment, remote deletion or payment.
