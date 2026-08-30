# Brief — Life in the Fast Lane

> Written by me, not by a model. A model may interrogate it (`/brief-check`) but not author it.

## Problem

Why the game exists is stated in [`docs/docs/games/01-vision.md`](../docs/docs/games/01-vision.md)
§1–§2 and is not repeated here.

This repository owns **the game** — both halves of it. The spec set under `docs/docs/games/`
says what Life in the Fast Lane is, and the campaign sources under `src/campaigns/` are it,
published as portable JSON under `content/`. The engine that runs them is a dependency, not a
co-owner: it lives in SubZeroDev.GameEngine and is consumed here as a pinned submodule.

Two problems follow from that, and the second is downstream of the first.

**The spec set drifts faster than it is read.** It is the contract the engine repo implements
from, and the observed failure modes, with worked examples, are catalogued in
[`AGENTS.md`](../AGENTS.md) § *Where drift happens*. Three shapes recur:

- A type changes in `04-engine-specification.md` and the prose in `03-game-design.md` still
  describes the old one.
- A number that was invented so the harness had something to run gets read as decided design.
- A concept is introduced without a lifecycle, and nothing in the set says who creates or
  retires it.

Each is only discoverable by reading the whole set at once, which is why they survive.

**And a spec nothing is built from is not checkable.** The set was written to be implemented,
and until a campaign was authored against it no drift check could see the difference between a
document that is right and one that merely reads well. Authoring the game here closes that:
the campaign sources compile against the engine's exported types, so a spec claim the types
contradict now fails a build rather than waiting to be noticed by a reader.

## Who it is for

One developer, plus the agent sessions implementing from these documents. Two consumers, and
they read different halves. [SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine)
implements the `simulation` kind against the spec set and cannot ask a clarifying question at
build time. A host — [SubZeroDev.Platform](https://github.com/The-Running-Dev/SubZeroDev.Platform),
or any other — fetches the published campaign JSON under `content/` and never reads the specs
at all. Players are the game's audience, not this document set's.

## Non-goals

The game's non-goals are [`docs/docs/games/01-vision.md`](../docs/docs/games/01-vision.md) §5
and are binding here by reference, not restated.

Additionally, out of scope for this repository permanently:

- **Engine source code** — the core, the kinds, and the clients live in SubZeroDev.GameEngine
  and are consumed here through the published authoring and runtime surfaces
  (`@the-running-dev/game-engine` and its `/authoring` subpath). A change this game needs in
  the engine is raised there, never worked around here. **Campaign content is not engine source
  code and is in scope** — see the decision of 2026-08-30 in
  [`90-decisions.md`](90-decisions.md).
- Hosting, deployment, and NEaaS concerns — they live in SubZeroDev.Platform. Publishing the
  campaign JSON is this repository's job; serving it is not.
- Any change to the Docusaurus base image or template beyond the local overrides already in `docs/`.

## Definition of done

- SubZeroDev.GameEngine can implement the first playable scope
  ([`01-vision.md`](../docs/docs/games/01-vision.md) §4) from `docs/docs/games/01`–`05` without
  raising a clarifying question about meaning. Checked by attempting it, not by review.
- Every type, field, and enum in `04-engine-specification.md` that `03-game-design.md` describes
  in prose is described consistently in both. Zero unmirrored pairs.
- Every number currently marked provisional is either decided, or carries a written reason for
  remaining deferred and the condition that would settle it.
- No concept in the set lacks a stated lifecycle — for each, what creates it and what retires it
  is written down.

And for the game itself, `docs/docs/games/life-in-the-fast-lane.md` § *Definition of Done* is
authoritative and is not restated here. One line is this repository's rather than the engine's:
the campaign JSON under `content/` is built from `src/campaigns/`, matches it on every run, and
is what a host fetches.

## Environment

Single author, Windows host under `D:\Dropbox\Projects\`. Two toolchains, deliberately
separate:

- **The spec set and its checker** — PowerShell Core, gated by `tools/Test-SpecSet.ps1` and
  `tools/Test-DesignState.ps1`. The reader-facing deliverable is a Docusaurus site built from
  `docs/` via Docker (`docs.ps1`).
- **The game content** — Node (`>=24`) and TypeScript, authored in `src/campaigns/` against
  `@the-running-dev/game-engine`, which is pinned as the `engine/` submodule and built from
  source rather than installed from a registry. `npm run check` is its gate. The published
  artifact is the JSON under `content/`.

No runtime, no concurrency, no data volume, no users at rest — this repository builds content,
it does not serve it. A network is needed to clone the submodule and install dependencies, and
for nothing else.

## Lifespan

Maintained for years. The full pipeline is justified — contract, slices, tracking, and periodic
reconciliation passes.
