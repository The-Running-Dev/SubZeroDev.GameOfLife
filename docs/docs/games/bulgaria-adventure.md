# Game — Bulgaria: Make-Your-Own-Adventure

**Kind:** `story-graph`
**Roadmap position:** **The MVP vehicle** — a minimal slice of this is the first thing built
**Content model:** `engine/03-story-graph-kind.md` § 1 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a` — written
**Code:** none yet

> One of two games this repo is building on the narrative engine. The other is
> [`life-in-the-fast-lane.md`](life-in-the-fast-lane.md). They share only the Bulgarian
> setting and the deadpan voice — see `engine/01-vision.md` § 1 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a`.

---

## What it is

A branching, choose-your-own-adventure game set in the same absurd Bulgaria. No weekly
loop, no needs, no economy — you read a scene, choose one of a few options, and follow
the branch. State is a handful of typed variables; some transitions are seeded-random;
arcs end in endings, one of which unlocks the achievement **"It Builds Character."**

This is the **story-graph kind's flagship game**, and — critically — the **simplest
game to build.** Its whole loop is *scene → choice → consequence → next scene*. That
makes it the vehicle for the MVP: the smallest game that exercises the entire platform.

## Structure — themed mini-arcs

The [`bulgaria.md`](bulgaria.md) source scenes become nodes, grouped into short
connected arcs (each with its own state and gated choices, independent of the others):

| Arc | Scenes | Exercises |
|---|---|---|
| **Bureaucracy** | Municipality, Government Office, Room 14/6 | Loops, requirement-gated retries, a rising counter |
| **Inheritance** | Property Inheritance, Village Life, Family Meeting | Branching on prior choices, relationship variables, an ending |
| **Enterprise** | Starting a Business, Entrepreneur | Accumulating debt/patience, multiple gated endings |
| **Driving** | Driving, BMW Ownership | A short two-scene arc, a "trust the mechanic" flag |
| **Return** | Expat Returns | Standalone opener; seeds variables the other arcs read |

The MVP builds **only the Bureaucracy arc** (see `engine/MVP.md` § 3 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a`); the rest
follow once the loop is proven.

## Dependencies

1. The core (shared, proven by the MVP).
2. The `story-graph` kind — needs `engine/03-story-graph-kind.md` § 1 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a` written first.
3. Content — the arcs above, authored as validated nodes.

## Definition of Done — this game (full version)

*Proposed; refine as needed.*

- [ ] All five arcs playable through the text client, each reaching at least one ending.
- [ ] The same game playable through the MCP server, identically.
- [ ] Requirement-gated choices grey out with a reason (Transparent Consequences).
- [ ] Seeded random transitions reproduce identically from the same seed.
- [ ] At least one achievement unlocks exactly once and persists to the player profile.
- [ ] Save mid-adventure, load, continue with no state loss.
- [ ] Content validation passes: no dangling node ids, no undeclared variables, no unreachable arcs (Tier 1 + Tier 2).
- [ ] Two runs from the same seed and choice log produce byte-identical output.

The MVP's Definition of Done is a strict subset of this — see `engine/MVP.md` § 5 @ `bc74a62a2a0a57c5fd82f337712868b6877bbc6a`.
