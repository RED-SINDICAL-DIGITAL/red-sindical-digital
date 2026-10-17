# Artist management PRO indicators — 2026-10-15

Branch audit/public-job-status-20261012; production untouched.

Management render and plan view previously considered pro_active or plan=pro without checking the expiry on the cached artist object. Initial plan fetch normally normalizes status, but transport failure could leave stale PRO text visible. Added shared artistHasCurrentPro guard for both displays. It supports pro_expires_at and legacy pro_expires, rejects invalid/past/exact-boundary dates, and preserves explicit legacy/admin PRO with no expiry. Server permissions and billing unchanged.

Validation: node --test tests/artist-manage-api.test.cjs — 8 passed, 0 failed. Tests include actual extracted helper for expiry boundaries plus existing session/refresh tests. No clock manipulation or subscription changes in staging. Live expired-profile visual remains unverified; current synthetic artist still has active PRO.
