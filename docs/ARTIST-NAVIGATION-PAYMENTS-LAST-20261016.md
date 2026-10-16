# Public artist navigation / payments last — 2026-10-16

User explicitly prioritizes completing the web app before real banking tests. Continue non-financial development with collection disabled; isolated simulated bank/fulfillment regressions remain useful and do not certify a real provider. Real credit validation, official ARS quote, production merchant setup, activation and renewal are final release gates, not blockers for current frontend work. No real-money simulation in production.

Public artist review found render() reconstructed tabs with Inicio selected while independent content/events responses were still arriving. It now captures visible selected tab before reconstruction, mounts the existing YouTube library, then restores through the current tab handler. Hidden/removed tabs fall back to Inicio. This keeps library-owned playlist navigation consistent without changing visibility permissions.

Following/unfollowing now dispatches the existing uadav:local-change notification after successful local persistence, allowing the account client to schedule synchronization instead of relying solely on its periodic pass. No claim that offline changes instantly reach another device; server revision/conflict handling stays unchanged.

Five new Node cases passed: selected tab restoration, hidden/missing fallback, library handler delegation, integration ordering, follow/unfollow persistence and sync events. Inline script syntax passed. Browser hydration race and physical device follow propagation remain to verify. No Worker/bank/production changes.
