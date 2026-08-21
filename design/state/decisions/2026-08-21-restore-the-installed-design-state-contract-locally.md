# decision/2026-08-21-restore-the-installed-design-state-contract-locally
Date: 2026-08-21
Anchor: 2026-08-21 — Restore the installed design-state contract locally
Status: accepted

## Claim
design/20-contract.md carries both paths. The AgentKit commit in .claude/kit.json is
provenance, while this local file is the offline contract the installed checker parses. Restore
the nine installed surfaces, persisted state schema, closed divergence classes, artifact globs,
and I-prefixed invariants without changing or weakening the SS-prefixed spec-set contract.
