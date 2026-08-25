# decision/2026-08-25-s18-6-derives-its-freeze-dependent-expectation-instead-of-pinning-it
Date: 2026-08-25
Anchor: 2026-08-25 — S18.6 derives its freeze-dependent expectation instead of pinning it
Status: accepted

## Claim
The expectation is computed from `Test-Path design/FROZEN.md` — the exit code and which of the two buckets the finding lands in are both derived, so the test asserts I21's conditional rather than one branch of it. Verified in both states rather than reasoned: 123/123 with the marker present and 123/123 with it absent.
