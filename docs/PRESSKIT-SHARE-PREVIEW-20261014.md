# Press Kit share preview consistency — 2026-10-14

Reproduced: expired PRO was denied by public/presskit but still allowed generating a public/share-link Press Kit preview. Shared preview routes now check current D1 plan (legacy fallback only when no plan exists), expiry, artist visibility, Press Kit switch and published snapshot; metadata is generated from the same explicit public projection used for public API reads.

Actual Worker + isolated SQLite PASS: active PRO share URL and HTML return 200; expired plan causes both API share URL and /share/presskit to return 404; HTML includes Open Graph description/image metadata; hidden/private markers absent; GET no-store; HEAD returns 200 without body; unpublish disables public page and share HTML. Private workspace content retained. Syntax passed. This does not verify WhatsApp crawler fetch or cache refresh, real-domain routing, image reachability or social-app rendering. No production/staging deployment.
