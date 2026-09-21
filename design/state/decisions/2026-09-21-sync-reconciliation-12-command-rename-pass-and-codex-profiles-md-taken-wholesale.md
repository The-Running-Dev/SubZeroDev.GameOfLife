# decision/2026-09-21-sync-reconciliation-12-command-rename-pass-and-codex-profiles-md-taken-wholesale
Date: 2026-09-21
Anchor: 2026-09-21 — /sync reconciliation: 12-command rename pass, and codex/PROFILES.md taken wholesale
Status: accepted

## Claim
`AGENTS.md` and `.github/ISSUE_TEMPLATE/story.md` are corrected to the twelve command names
AgentKit commit `68c0250` renamed upstream (`/brief-check`→`/brief`, `/contract`→`/spec`,
`/freeze`→`/hold`, `/install-code-review-agent`→`/install-review`, `/kit-help`→`/help`,
`/kit-sync`→`/sync`, `/make-human-docs`→`/docs`, `/reconcile`→`/align`, `/refine`→`/tune`,
`/slices`→`/plan`, `/unfreeze`→`/resume`, `/verify`→`/check`); the rename is text-only, no rule
content changed. `codex/PROFILES.md` is taken wholesale from the kit's current version, since this
repository held no local fork of it to preserve.
