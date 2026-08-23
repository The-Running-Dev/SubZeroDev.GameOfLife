# Design state index

This document is a navigation view generated from `design/state/`. Edit the records, then run
`tools/Update-DesignProjection.ps1`; do not edit rows inside the projected regions.

## Units

<!-- units:start -->
| Id | Kind | Anchor |
|---|---|---|
| `unit/command/brief-check` | command | `.claude/commands/brief-check.md` |
| `unit/command/contract` | command | `.claude/commands/contract.md` |
| `unit/command/design` | command | `.claude/commands/design.md` |
| `unit/command/done` | command | `.claude/commands/done.md` |
| `unit/command/fix` | command | `.claude/commands/fix.md` |
| `unit/command/freeze` | command | `.claude/commands/freeze.md` |
| `unit/command/install` | command | `.claude/commands/install.md` |
| `unit/command/install-all` | command | `.claude/commands/install-all.md` |
| `unit/command/kit-help` | command | `.claude/commands/kit-help.md` |
| `unit/command/kit-sync` | command | `.claude/commands/kit-sync.md` |
| `unit/command/make-human-docs` | command | `.claude/commands/make-human-docs.md` |
| `unit/command/pr` | command | `.claude/commands/pr.md` |
| `unit/command/reconcile` | command | `.claude/commands/reconcile.md` |
| `unit/command/redteam` | command | `.claude/commands/redteam.md` |
| `unit/command/refine` | command | `.claude/commands/refine.md` |
| `unit/command/resolve` | command | `.claude/commands/resolve.md` |
| `unit/command/slice` | command | `.claude/commands/slice.md` |
| `unit/command/slices` | command | `.claude/commands/slices.md` |
| `unit/command/track` | command | `.claude/commands/track.md` |
| `unit/command/unfreeze` | command | `.claude/commands/unfreeze.md` |
| `unit/command/verify` | command | `.claude/commands/verify.md` |
| `unit/document/agent-md` | document | `agent.md` |
| `unit/document/agents-md` | document | `AGENTS.md` |
| `unit/document/companions-md` | document | `.claude/COMPANIONS.md` |
| `unit/document/design-00-brief` | document | `design/00-brief.md` |
| `unit/document/design-10-design` | document | `design/10-design.md` |
| `unit/document/design-20-contract` | document | `design/20-contract.md` |
| `unit/document/design-30-slices` | document | `design/30-slices.md` |
| `unit/document/design-90-decisions` | document | `design/90-decisions.md` |
| `unit/document/design-state-index` | document | `design/state-index.md` |
| `unit/document/issue-template-bug` | document | `.github/ISSUE_TEMPLATE/bug.md` |
| `unit/document/issue-template-story` | document | `.github/ISSUE_TEMPLATE/story.md` |
| `unit/document/readme-md` | document | `README.md` |
| `unit/script/invoke-codexcommand` | script | `tools/Invoke-CodexCommand.ps1` |
| `unit/script/invoke-donehousekeeping` | script | `tools/Invoke-DoneHousekeeping.ps1` |
| `unit/script/measure-session` | script | `tools/Measure-Session.ps1` |
| `unit/script/new-designdocs` | script | `tools/New-DesignDocs.ps1` |
| `unit/script/read-designstate` | script | `tools/Read-DesignState.ps1` |
| `unit/script/read-specset` | script | `tools/Read-SpecSet.ps1` |
| `unit/script/sync-kit` | script | `tools/Sync-Kit.ps1` |
| `unit/script/test-companion` | script | `tools/Test-Companion.ps1` |
| `unit/script/test-designdrift` | script | `tools/Test-DesignDrift.ps1` |
| `unit/script/test-designstate` | script | `tools/Test-DesignState.ps1` |
| `unit/script/test-gatescache` | script | `tools/Test-GatesCache.ps1` |
| `unit/script/test-specset` | script | `tools/Test-SpecSet.ps1` |
| `unit/script/test-verifyreport` | script | `tools/Test-VerifyReport.ps1` |
| `unit/script/test-writesurface` | script | `tools/Test-WriteSurface.ps1` |
| `unit/script/update-designprojection` | script | `tools/Update-DesignProjection.ps1` |
| `unit/script/update-workmirror` | script | `tools/Update-WorkMirror.ps1` |
| `unit/script/wait-pullrequestcheck` | script | `tools/Wait-PullRequestCheck.ps1` |
<!-- units:end -->

## Bound by

<!-- bound-by:start -->
| Invariant | Bound by |
|---|---|
| I1 | `unit/command/resolve` |
| I2 | `unit/script/wait-pullrequestcheck` |
| I5 | `unit/command/resolve` |
| I6 | `unit/command/fix` |
| I7 | `unit/script/wait-pullrequestcheck` |
| I8 | `unit/script/wait-pullrequestcheck` |
| I9 | `unit/document/agents-md` |
| I10 | `unit/command/fix` |
| I11 | `unit/command/fix` |
| I12 | `unit/script/test-designdrift` |
| I13 | `unit/script/test-designdrift` |
| I14 | `unit/script/update-designprojection` |
| I15 | `unit/script/test-designstate` |
| I16 | `unit/script/test-designstate` |
| I17 | `unit/script/read-designstate` |
| I18 | `unit/script/test-designstate` |
| I19 | `unit/script/test-designstate` |
| I20 | `unit/script/test-designstate` |
| I21 | `unit/script/test-designstate` |
| I22 | `unit/document/design-20-contract` |
| I23 | `unit/script/test-designstate` |
| I24 | `unit/script/read-designstate` |
| I25 | `unit/script/update-designprojection` |
| I26 | `unit/document/design-90-decisions` |
| I27 | `unit/document/design-10-design` |
| I28 | `unit/command/track` |
| I29 | `unit/script/update-designprojection` |
| I30 | `unit/script/test-designstate` |
| I31 | `unit/script/test-designstate` |
<!-- bound-by:end -->

## Consumers

<!-- consumers:start -->
| Contract | Consumers |
|---|---|
| contract/fix | — |
| contract/read-designstate | `unit/script/test-designstate`, `unit/script/update-designprojection` |
| contract/resolve | `unit/command/pr` |
| contract/test-companion | `unit/command/install-all`, `unit/command/verify`, `unit/script/sync-kit` |
| contract/test-designdrift | `unit/command/track` |
| contract/test-designstate | `unit/command/verify` |
| contract/update-designprojection | `unit/script/test-designstate` |
| contract/update-workmirror | `unit/command/track` |
| contract/wait-pullrequestcheck | `unit/command/pr`, `unit/command/resolve` |
<!-- consumers:end -->

## Decision affects

<!-- decision-affects:start -->
| Decision | In force for |
|---|---|
| decision/2026-08-20-04-22-2-is-the-sole-provisional-register-and-every-row-carries-a-settling-condition | `unit/script/test-specset` |
| decision/2026-08-20-a-concept-is-a-state-bearing-entity | `unit/script/test-specset` |
| decision/2026-08-20-agents-md-claude-md-direction-on-kit-install | `unit/document/agents-md` |
| decision/2026-08-20-closure-distinguishes-a-mirror-obligation-from-content | `unit/script/read-specset` |
| decision/2026-08-20-house-conventions-path-on-kit-install | `unit/document/agents-md` |
| decision/2026-08-20-marker-vocabulary-four-declared-id-forms-visible-bodies-one-corpus-wide-namespace | — |
| decision/2026-08-20-measure-session-ps1-hooks-on-kit-install | `unit/script/measure-session` |
| decision/2026-08-20-mirror-obligations-declared-not-inferred-from-prose | `unit/script/test-specset` |
| decision/2026-08-20-no-enginepath-cross-repository-references-are-permanently-unchecked | `unit/script/read-specset` |
| decision/2026-08-20-reduce-the-mirrored-surface-rather-than-mirror-everything | `unit/document/design-10-design` |
| decision/2026-08-20-restricted-grammar-that-fails-loudly-not-a-typescript-parser | `unit/script/read-specset` |
| decision/2026-08-20-spec-set-invariants-derived-from-the-prose-not-from-a-sidecar | `unit/script/read-specset` |
| decision/2026-08-20-the-checker-is-a-ci-gate-and-a-finding-fails-the-build | `unit/script/test-specset` |
| decision/2026-08-20-the-checker-is-read-only-and-a-verification-gate-rather-than-a-hook-or-ci | `unit/script/test-specset` |
| decision/2026-08-20-tooling-is-in-scope-the-checker-is-powershell-in-tools | `unit/script/read-specset` |
| decision/2026-08-20-two-files-with-the-module-boundaries-enforced-by-ast-inspection | `unit/script/read-specset`, `unit/script/test-specset` |
| decision/2026-08-20-typed-classes-for-the-records-pscustomobject-for-the-result-envelope | `unit/script/read-specset`, `unit/script/test-specset` |
| decision/2026-08-21-marked-region-identity-is-document-scoped-and-form-is-repository-wide | `unit/document/design-20-contract` |
| decision/2026-08-21-restore-the-installed-design-state-contract-locally | `unit/document/design-20-contract` |
| decision/2026-08-22-the-8-7-housing-quality-row-s-settling-condition-is-the-simulation-harness | `unit/script/test-specset` |
| decision/2026-08-23-a-mirror-obligation-is-all-or-nothing-and-the-bound-is-recorded-rather-than-widened | `unit/document/design-20-contract` |
| decision/2026-08-23-an-unresolvable-subject-is-not-an-unchecked-run-ss5-splits-the-list | `unit/script/test-specset` |
<!-- decision-affects:end -->

## Question affects

<!-- question-affects:start -->
| Question | Blocks |
|---|---|
| _(no question records yet)_ | |
<!-- question-affects:end -->

## Outstanding work

<!-- outstanding:start -->
| Rank | Issue | Title | Criteria | Mirrored at |
|---|---|---|---|---|
| 4 | #11 | S4 — Every reference resolves, and every claim about the engine repository pins a commit | S4.1, S4.2, S4.3, S4.4, S4.5, S4.6 | `be5316f53cd0f5b58ab552e34fa0a8ec9c9b25bf` |
| 6 | #13 | S6 — Everything the game keeps in state is counted, and told what it must say | S6.1, S6.2, S6.3, S6.4, S6.5 | `be5316f53cd0f5b58ab552e34fa0a8ec9c9b25bf` |
| 7 | #14 | S7 — The missing lifecycles are written | S7.1, S7.2, S7.3 | `be5316f53cd0f5b58ab552e34fa0a8ec9c9b25bf` |
| 19 | #19 | Restore missing design-state closure records | — | `be5316f53cd0f5b58ab552e34fa0a8ec9c9b25bf` |
<!-- outstanding:end -->
