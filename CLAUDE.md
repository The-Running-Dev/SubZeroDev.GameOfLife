# Project Instructions

## What this project is

This repo holds **Life in the Fast Lane** — the flagship game spec — and the **engine
implementation** code. The platform (engine) *specs* are a **separate companion project**.

1. **Life in the Fast Lane** (`docs/docs/games/`) — a satirical life-simulation game in the
   lineage of *Jones in the Fast Lane* (Sierra, 1990). The detailed spec set (~105 KB
   engine doc); it is the flagship `simulation`-kind game of the Narrative Engine.
2. **Engine implementation** (`src/engine/`) — a TypeScript package (strict mode, vitest,
   eslint with the determinism guard) carrying the Phase 1 core (seeded RNG, canonical
   serialization). The rest is still spec.

**The platform (engine) specs are a separate project:**
[SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine)
— the architecture, the core/API (`04-core`), the story-graph kind, MVP, TODO,
open-questions, and hosting vision. Much of what that platform calls "the core"
(projection boundary, condition DSL, seeded RNG, tiered validation, determinism harness,
save/migration) was first designed in the Life in the Fast Lane engine spec here. The two
repos reference each other by name (`games/…` there, `engine/…` here). **When building the
engine code in `src/engine/`, the companion repo's `04-core` / `03-story-graph-kind` are
the contracts.**

The game docs are a **Docusaurus site rooted at `docs/`** (see Tooling → Docs site); the
markdown lives under `docs/docs/games/`.

The build strategy is engine-first: a deterministic, interface-independent engine, proven
by automated tests and a plain text client before any UI. Once the API is proven, UI is
presentation.

## The document sets

Read each set in order. Files are scoped deliberately and cross-reference by section
number.

**Games — `docs/docs/games/`** (the flagship Life spec, the game catalog, shared source)

| File | Holds |
|---|---|
| `docs/docs/games/01-vision.md` | Why the game exists, creative principles, non-goals, risks |
| `docs/docs/games/02-narrative-voice.md` | The narrator, tone rules, long-arc gags. **The project's strongest asset** |
| `docs/docs/games/03-game-design.md` | Mechanics, numbers, content targets, the map, the scenario |
| `docs/docs/games/04-engine-specification.md` | Types, API, systems, testing, phases (~105 KB) |
| `docs/docs/games/05-text-client.md` | The first client, and the instrument that proves the API |
| `docs/docs/games/life-in-the-fast-lane.md` | **Game 1** — the `simulation` kind (Jones clone). Depth milestone; Bulgaria is its culture pack. Full spec is `docs/docs/games/01`–`05` |
| `docs/docs/games/bulgaria-adventure.md` | **Game 2** — the `story-graph` kind (make-your-own-adventure). The MVP vehicle |
| `docs/docs/games/bulgaria.md` | Shared Bulgarian **source scenes** — used by both games, committed to neither's mechanics |

**Narrative Engine (platform) specs — separate repo**

The platform/API/hosting specs moved to
[SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine):
`01-vision`, `02-architecture`, `04-core` (the API/types contract), `03-story-graph-kind`,
`MVP`, `TODO`, `OPEN-QUESTIONS`, `neaas-platform-vision`. When working the engine code
here (`src/engine/`), those are the contracts to build against — clone the companion repo
alongside this one.

**Code — `src/engine/`**

| File | Holds |
|---|---|
| `src/engine/` | The engine npm package: `package.json`, `tsconfig.json` (strict), `eslint.config.js` (determinism guard), `README.md` |
| `src/engine/src/core/` | Phase 1 core: `rng/pcg32.ts` (seeded PCG32, verified), `serialize/canonical.ts` (canonical serialization), with `.test.ts` alongside each. Nested under `src/engine/` to leave room for `src/client` later |

**Numbering is positional.** A new document inserted between existing ones means
renumbering everything after it and rewriting every cross-document link. Prefer
appending unless position genuinely matters.

### Where drift happens

The `docs/docs/games/03` ↔ `docs/docs/games/04` pair drifts: `04` (engine spec) is
largely an implementation-of `03` (design), and an edit to one that isn't mirrored in the
other is the most common defect here. Every time a type changes in `04`, check whether
`03` describes it in prose. (The platform specs have the same `03`↔`04` hazard — in the
companion repo.)

Real examples already caught: `wisdom` added to `AttributeState` but missing
from the design doc's attribute list; `finalized` removed from
`WeeklyActionPlan` but still listed as a planning affordance; the flagship event
example targeting a relationship path that stopped existing when relationships
moved onto the actor.

When you change a type, also update: the prose description, any example using
it, the projection in §6, and the test list in §18.

---

## Tooling

### Docs site — `docs/` (Docusaurus)

The specs are served as a Docusaurus site. `docs/` is both the Docusaurus project
overlay and the Docker build context:

- `docs/docs/` — the markdown content (`engine/`, `games/`). Numeric filename prefixes
  drive sidebar order.
- `docs/docusaurus.config.ts`, `docs/sidebar.ts` — **local overrides** of the base
  image's defaults (autogenerated sidebar; broken-link checks set to `warn`). Note: the
  spec docs reference `src/engine/` code as inline paths, not links — that code lives
  outside the docs content root, so it is deliberately not linked from the site.
- `docs/Dockerfile` — extends `ghcr.io/the-running-dev/docs-template` and `COPY . .`
  overlays the above onto `/template`. That copy is what overwrites the base config/sidebar.

Run it with **`docs.ps1`** (repo root; needs Docker Desktop running):

| Command | Does |
|---|---|
| `./docs.ps1` | Build the image, run it, serve <http://localhost:3000/docs> |
| `./docs.ps1 -Live` | Same, but bind-mounts `docs/` so edits hot-reload without a rebuild |
| `./docs.ps1 -BuildOnly` | Build the image only |

`-Port`, `-Tag`, `-BaseImage` override the defaults.

### graphify — `/graphify`

Personal skill at `~/.claude/skills/graphify/`. Turns the folder into a knowledge
graph with community detection.

**It is expensive.** A full rebuild on this corpus is ~200K input tokens. Four
runs in one session consumed 880K and contributed to hitting a session limit.
Do not run it casually. There is **no current graph** — the old `graphify-out/` was
deleted after the `docs/` reorg; run `/graphify` to build a fresh one when you need it
(worth it once TypeScript exists — AST extraction is free).

| Command | Cost | Use when |
|---|---|---|
| `/graphify` | ~200K tokens | Corpus changed substantially |
| `/graphify --update` | proportional to changed files | Small changes — **read the trap below first** |
| `/graphify --cluster-only` | free | Re-examine structure without re-extracting |
| `/graphify query "..."` | small | You have a specific question |

#### TRAP: `--update` destroys cross-file edges

**This is not documented in the skill and it has already cost this project 62%
of its cross-document structure once.**

`build_merge` deletes every edge a re-extracted file owns. Chunked LLM
extraction can only *recreate* an edge when **both endpoints are in the same
chunk**. So re-extracting a changed file on its own permanently drops every edge
it had to unchanged neighbours.

> **Rule: when running `--update`, extract the changed files together with
> everything they cross-reference, even though those neighbours are unchanged.**
> On this project that means all the current docs in one chunk, every time.

Verify afterwards by comparing cross-file edge counts against the pre-update
backup. A drop means edges were lost, not that the docs got worse.

#### Other gotchas

- **Shrink guard** — refuses to write when the new graph has fewer nodes.
  Sometimes right, sometimes not. Check *why* it shrank before forcing past it.
  After the docs were renumbered, 207 of 312 old nodes pointed at dead paths and
  the shrink was entirely correct.
- **Token counts** — the Agent tool reports only aggregate `subagent_tokens`,
  with no input/output split, so reports show everything as input.

#### What it is actually good for

Finding **orphaned concepts**. It twice isolated `Opportunity` and
`ScheduledEvent` as single-node communities, which is how their missing
lifecycles were found. It also confirms whether newly-added mechanisms wired in
or landed disconnected — an audit you cannot perform on your own work by reading
it.

Once TypeScript exists, code is extracted structurally via AST with **no LLM and
no token cost**. Graphing a codebase is nearly free; graphing prose is not.

### claude-mem

Plugin at `~/.claude/plugins/cache/thedotmack/claude-mem/`.

**`/claude-mem:learn-codebase`** — reads every file in full, no skimming. Run it
after any long session of many small edits. Editing from diffs produces a drift
that only a full read catches: one run found twelve inconsistencies here,
including a functional bug where `DerivedPath` omitted `"world.strangeness"`,
making world drift specified in one section and impossible in another.

**`/claude-mem:cloud-sync`** — uploads observations to cmem.ai Pro. Requires a
sync token, a user id, and a SyncHub URL from cmem.ai → Connect, written into
`~/.claude-mem/settings.json` (flat, no nested `env` object). **The user must
place the token themselves** — Claude does not handle credentials.

**Troubleshooting:** `npx claude-mem doctor`. Note it reports a stale
`last-install-error.json` as a live warning even after a successful reinstall;
deleting that file is the fix. If a `claude-mem:*` skill fails to load, the
plugin's MCP server has dropped — restart the app or run `/mcp` from an
interactive terminal.

### Two memory systems — do not confuse them

- **claude-mem** — background worker on `localhost:37777`, captures observations
  passively into its own database. Not invoked directly.
- **Claude's file memory** — plain markdown under
  `~/.claude/projects/D--Dropbox-Projects-SubZeroDev-GameOfLife/memory/`,
  written deliberately, loaded each session via `MEMORY.md`.

Independent. Neither affects the other.

---

## Working conventions

Findings and review items are presented **one at a time for sign-off**, not
applied in bulk. When a suggestion is declined, record it in the affected
document as a known-and-retained issue rather than dropping it silently, so it
is not rediscovered later as a bug.

Provisional numbers — need drift rates, the scenario economics, `demandBand`
thresholds, the housing quality formula — are marked as such in the documents.
They exist so the simulation harness has something to run. Do not treat them as
decided design.
