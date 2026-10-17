# Presentation recovery — 2026-10-17

Existing audit branch only. Production unchanged, no Worker or payment configuration changes.

## Findings and repairs

Private workspace PUT previously awaited a health fetch without a deadline. Added shared readiness helper with 7-second AbortController deadline, finite/minimum build validation, Spanish recovery errors, cache reset on failure and timer cleanup. Existing call identity checks still run before writes and after readiness. Failed readiness never initiates PUT and existing save failure preserves local draft. A fulfilled health check remains cached; this is not a new proof of backend deployment identity.

Public presskit page previously described retry but offered none. Added explicit load retry, duplicate-click guard and validated public kit body before rendering or exposing print/share. Missing artist ID issues no request and offers no unusable retry. Loading/failure do not imply publication, entitlement or bank payment.

## Validation

25 local VM-based tests passed: 5 new recovery cases plus 9 workspace session/identity/publication-action checks, 5 public renderer/print checks and 6 everyday workspace tools checks. Inline syntax passed for both changed HTML pages. Autosave tests passed (continued edits, conflict pause, queued explicit publication and failure cancellation). Actual Worker + SQLite Press Kit publication privacy test passed. These are not live target-device tests.

At start, staging manifest identified 8e393e6282db01efe3e5230a7d59f1e32251dd6d. New frontend revisions require live staging verification after Pages update. Existing private browser account is unavailable; do not create duplicate profiles just to replace a lost browser session. Public retry can be checked without private access. Authenticated actual saving with delayed/failed health remains a manual integration gate.

Updated manual.html recovery instructions and guia.html; removed an unverified statistics claim from the public guide. Bank payments stay disabled and last. No production deployment, merge, data deletion, public synthetic publication or messages.
