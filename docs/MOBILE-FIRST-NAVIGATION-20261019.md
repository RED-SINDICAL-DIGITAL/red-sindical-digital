# Mobile-first navigation — 2026-10-19

## User direction
Design first for mobile, then adapt the same priorities to desktop and Smart TV. Admin must remain capable but understandable. Simplicity does not imply identical layouts or removal of important functions. Payments remain last, configured through Admin.

## Implemented in audit branch
- Mobile bottom navigation reduced from six to five destinations: Explorar, En vivo, Cartelera, Trabajo (Bolsa), Mi perfil. Removed redundant Inicio; shell brand remains a labeled Ir al inicio action. Desktop navigation unchanged.
- Hidden duplicate top account shortcut only on mobile, keeping bottom Mi perfil. Expanded search uses the space and larger search target.
- Explicit five-column inline/shared mobile CSS prevents conflicting six-column overrides.
- Mini media player uses horizontal 44px expand/close controls instead of stacked 32x30 controls, with 72px preview and ellipsis title. Radio controls, search favorites and profile/library tabs enlarged. Bottom labels use 11px.
- Media controls have accessible names; expand/minimize name follows current mode. Radio close has a clear name.
- Reduced-motion preference disables smooth scrolling and transitions in shared pages.

## Verification
Seven existing shell routing/source tests passed. Inline script syntax passed. Parsed mobile navigation confirms exact five routes and named media controls. No new implementation-mirroring test file added for these presentation changes.

Changes committed: ac104ca6d30d35bf1449655f2ae789530b7d1987 (shell), 5ca689ee5a954de07b757de3ad3f69c41d1fc617 (shared CSS). New Pages delivery/visual verification pending. Does not certify actual touch layout, physical mobile/tablet, TV remote flow or all viewport sizes.

Next acceptance: verify no bottom-bar overflow at small widths, search open/close, profile entry, media mini controls, and TV focus/navigation on actual target devices. Keep existing public circuits and payment restrictions.
