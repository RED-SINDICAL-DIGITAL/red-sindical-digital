# Platform CI coverage — 2026-10-15

Existing workflow already runs artist permissions, PRO payments/bank contract, private drafts, inquiries, navigation, autosave, radio/TV onboarding and staging isolation. No duplicate workflow added.

Pull request path coverage expanded to uadav-*.js, uadav-*.css, platform-*.js and root HTML so shared UI-only changes also run platform checks. Existing explicit paths retained. Workflow display name changed from Signal onboarding checks to Platform integration checks. Job contents:read permission preserved. No deployment step added.

Validation: YAML parsed successfully. Targeted local node test run passed 29 tests (management API, workspace identity, daily tools, inquiry account isolation and booking retry). Local bank confirmation integration passed signed-adapter checks using actual Worker plus SQLite, with no bank connected.

GitHub connector returned empty workflow_runs for commit bac992e9d297cfec0530d565b03961d926087a5d. This is not proof of CI execution or failure. Remote GitHub Actions outcome remains unverified. No production deployment or real financial activity.
