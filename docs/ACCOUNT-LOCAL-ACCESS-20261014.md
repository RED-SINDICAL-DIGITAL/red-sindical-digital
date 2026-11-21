# Local account access cleanup — 2026-10-14

Reproduced with actual client code: disconnect left an account-derived artist token/marker in local storage; recovery rotation could write a completed response after the active account credential changed. Correction reuses a narrow cleanup for account-derived artist sessions on disconnect/revocation, preserving independent legacy artist invitations and local profile/library content. Rotation captures credential and account generation, verifies both after the response and validates the replacement UAC secret shape before storing it.

Four client behavior tests PASS (two failed before fix): derived access removed on disconnect with local profile/favorites retained; independent invitation retained; switched-account rotation rejected without overwriting backup; valid rotation persists on the same account. Workspace/tool tests also passed (13 combined) and client syntax passed. No real credentials or account content used.

Disconnect is local unlinking, not server-side device revocation; explicit device revoke remains separate. The pre-existing local recovery-backup policy is unchanged. All frontend references/cache versions for the accumulated client changes still need integration before deployment. CI updated, latest run unverified; production/staging unchanged.
