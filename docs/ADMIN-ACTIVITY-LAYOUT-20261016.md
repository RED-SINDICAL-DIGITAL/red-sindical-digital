# Admin activity layout — 2026-10-16 UTC / 15 October Argentina

Actual authenticated staging dashboard showed activity text wrapping nearly character by character. DOM measurement: card width 288.4px; grid columns 36px / 7.89px / 200.52px; text block height 565.3px. Unbroken reference badge consumed the available inline width.

Changed shared Admin activity cards to icon + minmax(0,1fr), placed reference badge on a separate row with wrapping and max-width 100%, and allowed only-child content to span both columns. Updated stylesheet version in admin.html. No data, permissions or Worker change.

After staging deployment and reload, same actual card measured columns 34px / 221.4px; text height 38.3px. Screenshot confirmed readable rows and bounded references. Admin session persisted through reload. This verifies desktop cloud browser layout only; mobile/tablet/TV hardware remains unverified. Production untouched.
