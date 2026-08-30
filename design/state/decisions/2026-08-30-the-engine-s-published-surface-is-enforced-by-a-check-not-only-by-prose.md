# decision/2026-08-30-the-engine-s-published-surface-is-enforced-by-a-check-not-only-by-prose
Date: 2026-08-30
Anchor: 2026-08-30 — The engine's published surface is enforced by a check, not only by prose
Status: accepted

## Claim
The campaign sources and the export tooling reach the engine through its two published
specifiers only — `@the-running-dev/game-engine` and its `/authoring` subpath — and that
boundary is asserted by a test rather than stated in prose alone. The submodule places the
engine's entire source tree inside this working tree, so the packed-tarball boundary that
enforces the surface in the engine repository does not exist here and a relative import past
it would typecheck, run, and pass every gate until the pin moved.
