# PRO plan readiness — 2026-10-16

Actual staging browser plan tab confirmed collection disabled and no order. Found purchase button initially enabled until async check; now disabled in initial markup and before every status request. Only enabled collection with positive configured periods can enable it. Existing pending/reported orders keep new purchase disabled. Terminal approved/rejected orders can choose a configured period for renewal/new order if collection enabled. No new prices or collection switches changed.

Approved historical order displays Pago confirmado; statement PRO activo depends on artistHasCurrentPro. Otherwise directs refreshing current validity. Payment confirmation and current entitlement are not interchangeable. Async plan rendering is pinned to artist id, token, current tab and connected target box, including late failure. Backend remains authoritative for payment, duplicate orders, ownership and entitlement.

Nine new VM/source tests and eight existing management API tests pass (17 total). Inline management syntax passes. Added to CI. Live browser regression against this new revision pending; before patch, live disabled configuration was observed. No payment/order/transfer created, no Worker change, production untouched. No bank adapter connected; this does not claim automatic bank receipt verification.

## Actual staging browser confirmation

Reloaded account-linked synthetic artist Plan tab: Elegir mi PRO visibly disabled while Consultando orden; after remote reply it remained disabled and showed Cobro PRO todavía no habilitado. Actualizar estado became disabled during its request, then recovered and preserved disabled purchase state. No order/payment/transfer created, configuration unchanged. Current artist remains FREE and hidden. Confirms loading/disabled-collection branch only; historical approved/expired order and enabled renewal branches are covered by VM tests, not claimed as real payment browser tests. Production untouched.
