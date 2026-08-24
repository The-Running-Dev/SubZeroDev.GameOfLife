# Game — Life in the Fast Lane

**Kind:** `simulation`
**Roadmap position:** Depth milestone — built *after* the MVP proves the platform
**Engine spec:** fully specified in [`01-vision.md`](01-vision.md) (~150 KB)
**Code:** none yet

> One of two games this repo is building on the narrative engine. The other is
> [`bulgaria-adventure.md`](bulgaria-adventure.md). They share nothing mechanical — see
> `engine/01-vision.md` § 2 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a`.

---

## What it is

A satirical weekly life-simulation in the lineage of *Jones in the Fast Lane* (Sierra,
1990). The player gets 14 time units a week and spends them across work, study, job
hunting, rest, relationships and errands; the engine resolves needs, economy, careers,
housing and events at the end of each week; a rival races to the same goals. Deadpan
narrator, absurd world.

This is the **simulation kind's flagship game** and the deepest content in the
project. Its engine specification *is*, in platform terms, the simulation kind plus most
of the shared core (projection, condition DSL, seeded RNG, tiered validation,
determinism harness, save/migration).

## Bulgaria is a culture pack *of this game*

"Jones-in-Bulgaria" is **not a separate game** — it is a content pack over this one
(`engine/02-architecture.md` § 4a @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a`). Same weekly loop and
mechanics; Bulgarian jobs, bureaucratic events, inheritance disputes, prices, and a
Bulgarian narrator voice swapped in. The source scenes in [`bulgaria.md`](bulgaria.md)
feed this pack as events and situations. Building the culture pack requires this game
first.

## Dependencies

1. The core (shared, proven first by the MVP).
2. The `simulation` kind — the bulk of [`04-engine-specification.md`](04-engine-specification.md).
3. Base content — the "Stable Life" scenario ([`03-game-design.md`](03-game-design.md) §16).
4. *(optional)* the Bulgaria culture pack, as flagship alternate content.

## Definition of Done — this game

*Proposed; refine as needed.*

- [ ] A full 52-week "Stable Life" scenario is playable start to finish through the text client.
- [ ] The same game is playable through the MCP server, identically.
- [ ] Win and loss both reachable; the goal/failure precedence resolves per scenario.
- [ ] Save mid-game, load, and continue with no state loss.
- [ ] Two runs from the same seed and action log produce **byte-identical** `serialize()` output (the determinism harness passes).
- [ ] The engine spec's 20 acceptance criteria ([`04-engine-specification.md`](04-engine-specification.md) §19) all pass.
- [ ] At least one culture pack (Bulgaria) loads and swaps content without an engine change.

## Why it is not the MVP

It is the largest build in the project. Proving the *platform* does not require it —
the platform thesis (engine once, many clients, campaigns as data, MCP-first) is proven
far more cheaply by the story-graph MVP. This game is the milestone that proves the
platform has *depth*, and it comes second. See `engine/MVP.md` § 1 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a`.
