# decision/2026-08-20-the-checker-is-read-only-and-a-verification-gate-rather-than-a-hook-or-ci
Date: 2026-08-20
Anchor: 2026-08-20 — The checker is read-only, and a verification gate rather than a hook or CI
Status: accepted

## Claim
No module writes to the corpus, and none may gain that power later — checking must be a fixed point, and fixing is a person's decision and an editing command's job. The check is a gate the repository's verification command discovers and runs, invoked deliberately. Status 2 takes precedence over 1, matching the existing tooling.
