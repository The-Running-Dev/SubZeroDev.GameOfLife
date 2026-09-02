# decision/2026-09-01-cp1-s-check-decides-the-engine-before-the-declared-packages-fallback
Date: 2026-09-01
Anchor: 2026-09-01 — CP1's check decides the engine before the declared-packages fallback
Status: accepted

## Claim
CP1 is held by this repository rather than by its dependency's packaging. `isAllowedSpecifier`
settles an engine-scoped specifier against `PUBLISHED_ENGINE_SURFACE` alone and rejects anything
else, instead of letting it reach the declared-packages fallback, where `packageNameOf` reduces
every subpath to the declared dependency name and allows it. The engine's `exports` map publishes
only `.` and `./authoring`, so such an import cannot resolve today — which is why nothing was
broken and why the gap was invisible: the invariant was true, but held elsewhere. `Evidence` on
CP1 names this test, so the test is what must enforce it, per the precedent of
`90-decisions.md` (2026-08-29, six SS invariants gain the tests their Enforcement column already
claimed). A negative case asserts both subpath forms are rejected and both published ones
accepted, and the guard is verified load-bearing by removing it.
