# Pending time format — 2026-10-16

Date formatter now explicitly requests 24-hour local-device display. Date-only values remain date-only, without inventing midnight; missing/unparseable values show Fecha no disponible. Existing stored timestamps and sort values remain unchanged. Does not normalize timezone-less legacy records to UTC or claim a verified timezone migration.

Validation: six admin-kit-review tests passed, including morning/evening distinction, date-only and missing/invalid values. Existing mixed-source chronology test retained. Script cache version bumped. Live authenticated visual and physical-device timezone verification remain pending. No production, Worker, data or permission changes.
