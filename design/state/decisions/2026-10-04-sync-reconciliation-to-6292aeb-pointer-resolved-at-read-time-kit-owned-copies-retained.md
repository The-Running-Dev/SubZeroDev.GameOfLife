# decision/2026-10-04-sync-reconciliation-to-6292aeb-pointer-resolved-at-read-time-kit-owned-copies-retained
Date: 2026-10-04
Anchor: 2026-10-04 — /sync reconciliation to `6292aeb`: pointer resolved at read time, kit-owned copies retained
Status: accepted

## Claim
`AGENTS.md`'s pointer section resolves the shared rules file at read time ("resolved from
`$env:AGENTKIT_HOME` if set, else `$HOME/.agent-kit`") instead of carrying a baked-in absolute path,
and `.github/ISSUE_TEMPLATE/bug.md` line 31 takes the kit's standard-mode wording with the
handoff-mode override. `.claude/kit.json` advances to `6292aeb`. The tracked `.claude/commands/` and
`tools/` kit copies, and the kit-derived `design/state/` records, are left unchanged and staged as a
`## Open` item, because `verify.yml` still depends on them and the blocking findings are not yet
attributed to those records.
