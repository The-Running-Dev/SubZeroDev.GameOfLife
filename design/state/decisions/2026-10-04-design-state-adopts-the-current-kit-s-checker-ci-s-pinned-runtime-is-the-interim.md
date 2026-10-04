# decision/2026-10-04-design-state-adopts-the-current-kit-s-checker-ci-s-pinned-runtime-is-the-interim
Date: 2026-10-04
Anchor: 2026-10-04 — Design state adopts the current kit's checker; CI's pinned runtime is the interim
Status: accepted

## Claim
The current AgentKit `Test-DesignState.ps1` is the design-state checker this repository answers to.
Until its adoption lands, CI's runtime materialized from pinned kit commits stays the gate and the
2026-08-30 S19 deferral stays in force. The adoption retires the kit-owned unit, contract and
invariant records, migrates the rest to the retired-companion split, places the unplaced decisions,
resolves `design/10-design.md`'s two heading collisions, and reworks `verify.yml` to run the kit's
tools; its contract amendment belongs to `/spec`.
