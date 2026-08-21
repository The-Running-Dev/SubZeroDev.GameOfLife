# decision/2026-08-20-the-checker-is-a-ci-gate-and-a-finding-fails-the-build
Date: 2026-08-20
Anchor: 2026-08-20 — The checker is a CI gate, and a finding fails the build
Status: accepted

## Claim
Create `.github/workflows/verify.yml` with two flagged steps — the checker, and the Pester suite over `tools/`. Exit 1 and exit 2 both fail the step, matching how `Test-Companion.ps1` and `Test-DesignState.ps1` already behave. This makes Alternative 5's choice true rather than aspirational.
