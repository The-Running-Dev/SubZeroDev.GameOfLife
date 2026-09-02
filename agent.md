# Agent — Lessons Learned

Retrospective notes for whoever works this **game** repo next. Standing *instructions* live
in [`AGENTS.md`](AGENTS.md); durable *facts/preferences* live in the memory dir. This file
is what we learned the hard way.

Keep this file short — it loads into context, so length is a recurring cost. Add a lesson
only when it would have changed a decision.

> Engine-side lessons (the code, the core contracts, determinism) live in the companion
> [SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine)
> repo's `agent.md`.

---

## Token economy (read this first)

1. **graphify is ~80% of discretionary spend.** Four runs in one session ≈ 880K tokens,
   plus its ~15K-token skill prompt on every invocation. On this **prose** corpus its value
   is marginal — reading the docs directly found 12 inconsistencies; graphify found ~2. The
   TypeScript in `src/campaigns/` takes the free AST path, but it is dwarfed by the specs, so
   the cost profile is unchanged. Use `--cluster-only` / `query`;
   avoid full rebuilds. (The `--update` edge-loss trap: `AGENTS.md`.)
2. **Skill prompts inject their whole instruction file** on invocation. Only invoke a skill
   you will actually use.
3. **Full-file reads and large specs.** `04-engine-specification.md` is ~115KB (~33K
   tokens/read). Prefer grep / offset-limit when you know what you need.
4. **Start a fresh session at phase boundaries.** `CLAUDE.md` + memory + the docs re-prime a
   new session cheaply — that's why they're kept tight.

## What worked (keep doing)

- **Decide via questions, then batch-write.** Surface real forks one/few at a time with
  `AskUserQuestion` (recommended option first), get sign-off, *then* edit docs. Never
  bulk-apply findings unreviewed. The user routinely picks the non-recommended (more
  rigorous) option — so ask, don't assume.
- **Verify, don't assert.** Assert only what you have checked; report failures plainly.
- **Full read after many small edits.** Editing a large spec from diffs accumulates drift
  that only a full read catches (`learn-codebase` once found 12 inconsistencies here, incl.
  a functional bug where `DerivedPath` omitted `world.strangeness`).

## Drift hazards specific to this project

- **`docs/docs/games/03` ↔ `docs/docs/games/04`** drift most: `04` (engine spec) is an
  implementation-of `03` (design). When a type changes, update the prose, the examples, the
  projection (§6), and the test list (§18) too. Real catches: `wisdom` added to
  `AttributeState` but missing from the design doc's list; `finalized` removed from
  `WeeklyActionPlan` but still listed as an affordance; an event example targeting a
  relationship path that had moved onto the actor.
- **Two docs called "memory"** — claude-mem (background worker) vs Claude's file memory.
  Independent. Don't conflate.
- **Positional numbering** — inserting a doc means renumbering + rewriting every link.
  Prefer appending.
- **Encoding** — some imported source docs arrived CP1252, not UTF-8 (mojibake em-dashes /
  arrows). Rewrite to UTF-8 when importing.
- **Cite the issue, never `## Open`.** `## Open` in `design/90-decisions.md` is a staging
  area whose items `/track` removes the moment it files them, so a comment in the tree
  citing it is wrong within one `/track` run. Cost: two comments in the *published*
  campaign source told a reader their CP10 gap was recorded in a section that no longer
  carried it, and only a full reconciliation found them. Same shape as the `contentNotice`
  enumeration that read "15 of 30 random events" through four merged slices — **name the
  thing that does not move, not the thing that does.**

## Open concerns & assumptions

- **Engine-side unknowns** (incl. `PlayerProfile`, needed by the MVP achievement DoD) are
  tracked in the GameEngine repo's `OPEN-QUESTIONS.md`.
- **Provisional simulation numbers** — not decided design. `04-engine-specification.md`
  §22.2 is the sole register of them, with why each is deferred and what would settle it.
- **The docs-site base image is unverified.** `docs.ps1` builds on
  `ghcr.io/the-running-dev/docs-template`; we *assume* `@docusaurus/preset-classic` (v3),
  port 3000, `sidebar.ts`. Confirmed only against one local run.

## Orientation in one paragraph

This repo = **Life in the Fast Lane** (`docs/docs/games/`), a Jones-clone life-sim = the
`simulation` kind — **its specs and its campaign content** (`src/campaigns/` → `content/`). The **engine** (source + specs) is the companion
[SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine); hosting
is [SubZeroDev.Platform](https://github.com/The-Running-Dev/SubZeroDev.Platform). Bulgaria
is *two different games* — a culture pack on Jones (simulation), and a story-graph
make-your-own-adventure (the engine's MVP vehicle) — not one thing. This game builds on the
engine's contracts (`04-core`, `03-story-graph-kind`, in the engine repo).
