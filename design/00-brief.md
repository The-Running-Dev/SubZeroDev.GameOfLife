# Brief — Life in the Fast Lane (spec set)

> Written by me, not by a model. A model may interrogate it (`/brief-check`) but not author it.

## Problem

Why the game exists is stated in [`docs/docs/games/01-vision.md`](../docs/docs/games/01-vision.md)
§1–§2 and is not repeated here.

The problem *this* pipeline addresses is narrower: the spec set under `docs/docs/games/` is the
contract the engine repo implements from, and it drifts faster than it is read. The observed
failure modes, with worked examples, are catalogued in [`AGENTS.md`](../AGENTS.md)
§ *Where drift happens*. Three shapes recur:

- A type changes in `04-engine-specification.md` and the prose in `03-game-design.md` still
  describes the old one.
- A number that was invented so the harness had something to run gets read as decided design.
- A concept is introduced without a lifecycle, and nothing in the set says who creates or
  retires it.

Each is only discoverable by reading the whole set at once, which is why they survive.

## Who it is for

One developer, plus the agent sessions implementing from these documents. The consuming
system is [SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine),
which implements against this set and cannot ask a clarifying question at build time. Players
are the game's audience, not this document set's.

## Non-goals

The game's non-goals are [`docs/docs/games/01-vision.md`](../docs/docs/games/01-vision.md) §5
and are binding here by reference, not restated.

Additionally, out of scope for this repository permanently:

- Engine or client **source code** — it lives in SubZeroDev.GameEngine.
- Hosting, deployment, and NEaaS concerns — they live in SubZeroDev.Platform.
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

## Environment

Single author, Mac host under `/Users/ben/Dropbox/Projects/`. Docs-only repository: no runtime,
no concurrency, no data volume, no users at rest. The deliverable is a Docusaurus site built
from `docs/` via Docker (`docs.ps1`). PowerShell Core for scripts. Offline-capable; nothing here
depends on a network at build time beyond pulling the base image.

## Lifespan

Maintained for years. The full pipeline is justified — contract, slices, tracking, and periodic
reconciliation passes.
