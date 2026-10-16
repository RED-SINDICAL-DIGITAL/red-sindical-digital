# Synthetic Press Kit diagnostic — 2026-10-16

Added tests/staging-presskit-diagnostic.html. Isolated staging build explicitly includes it alongside the existing signal diagnostic, without traversing tests or publishing other fixtures. Origin guard renders only on https://uadav-stream-staging.pages.dev. No account API, credential entry, publication or payment. Sample includes fake public show and technical rider plus PRIVATE sentinel fields deliberately excluded by the real renderer. Uses exact shared Press Kit JS/CSS, print button and browser print lifecycle status.

10 local renderer/build isolation tests and inline diagnostic syntax passed. Platform integration checks509/run38959207583 and Job status contract checks265/run38959207572 passed for commit1745da2637dc18687f948f1e4e7cc668e9a4ab09.

Initial browser navigation hit the prior deployment fallback. Manifest still showed source4b432a6a4f54740833df2a8530325ab8719053c0 without diagnostic. Live rendering/print/PDF verification remains pending propagation; opening that fallback is not counted as success. Production unchanged; diagnostic does not certify authenticated Press Kit publication or actual PDF pagination.

## Live rendering confirmed

Manifest then identified source1745da2637dc18687f948f1e4e7cc668e9a4ab09 and the diagnostic file. Actual browser navigation redirected to /tests/staging-presskit-diagnostic and displayed synthetic presentation, section navigation, show metadata, collapsed technical requirements and public contact. Privacy sentinel check passed. Clicking Imprimir / guardar PDF produced no visible print view and counters stayed0/0 in this cloud browser. This is an unverified print attempt, not a generated PDF or confirmed platform defect. Screenshot captured synthetic rendering only. User can test native print/PDF from their own PC using this credential-free staging-only diagnostic. Production unchanged.
