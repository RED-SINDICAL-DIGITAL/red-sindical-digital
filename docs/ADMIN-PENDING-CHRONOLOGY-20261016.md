# Pending chronology and toolbar — 2026-10-16

Browser measurement did not confirm horizontal overflow in current pending cards (347px cards, paragraph scroll width equal to 293px content width). No speculative card-overflow patch applied.

Found actual data issue: pending normalize ignored inquiry creado dates. Added creado and fecha fallbacks after existing date fields so legacy inquiries have a visible timestamp and sort by actual creation date with other requests. Filter toolbar now lets type select share a row at wide widths while retaining wrapped layout at small widths. Cache version updated.

Validation: 5 admin-kit-review tests passed, including a new mixed inquiry/claim chronology regression using actual module load. Script syntax passed. Live updated chronology/toolbar verification pending initial checkpoint. No data, API, permissions or production changes.

## Live staging observation

Authenticated reload restored Pendientes. Existing synthetic inquiry now has a visible date and appears first instead of last; all 8 pending items remain. Toolbar rendered search, type and refresh on one row at the current desktop viewport. Screenshot captured. No data mutations. Timezone/clock presentation across mixed legacy timestamp formats has not been certified; this verification confirms inclusion and sorting logic, not the absolute displayed time for every source.
