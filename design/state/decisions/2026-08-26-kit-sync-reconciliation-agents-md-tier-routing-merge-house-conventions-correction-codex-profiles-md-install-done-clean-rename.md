# decision/2026-08-26-kit-sync-reconciliation-agents-md-tier-routing-merge-house-conventions-correction-codex-profiles-md-install-done-clean-rename
Date: 2026-08-26
Anchor: 2026-08-26 — /kit-sync reconciliation: AGENTS.md tier/routing merge, House conventions correction, codex/PROFILES.md install, done→clean rename
Status: accepted

## Claim
Diffed the 5 divergent tool scripts by hand rather than trusting the "Divergent-Skipped" label at face value: the kit converged on the same fix pattern (`ProcessStartInfo` + explicit UTF-8 `StandardOutputEncoding`, bypassing PowerShell's `&` call operator) this repo's own PRs already applied, just with different helper names — no functional gap, kept this repo's versions untouched. Merged the kit's AGENTS.md tier/routing/delegation/code-review changes in, preserved this repo's Project identity and (corrected) House conventions sections verbatim. Installed `codex/PROFILES.md` from the kit despite no confirmed Codex use here, to keep the new Vendor-model-aliases reference live rather than dangling. Applied the `/done`→`/clean` rename (deleted `done.md`, added `clean.md`) since `done.md` carried no local edits and the merged AGENTS.md text now names `/clean`. Corrected the House Conventions line to Windows/`D:\Dropbox\Projects\`, superseding the 2026-08-20 entry.
