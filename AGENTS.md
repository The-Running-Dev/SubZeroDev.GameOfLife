# Agent contract


**Read `AGENTS.shared.md` completely before this file.** It holds the rules every repository using AgentKit shares, resolved from the `AGENTKIT_HOME` environment variable if set, else `.agent-kit` in the home directory. AgentKit keeps nothing in this repository: its commands run from that checkout as `/agentkit:<name>`.

This file is binding for every agent session in this repo, regardless of tool or model.

## Project identity

### What this project is

This repo holds **Life in the Fast Lane** — the flagship game — and nothing else: **its specs
and its content**. The engine and the hosting layer are separate companion repos.

**Life in the Fast Lane** — a satirical life-simulation game in the lineage of *Jones in the
Fast Lane* (Sierra, 1990), the flagship `simulation`-kind game of the Narrative Engine. Two
halves, both owned here:

1. **The specs** (`docs/docs/games/`) — the detailed spec set, ~115 KB of engine document.
2. **The content** (`src/campaigns/` → `content/`) — the campaign sources themselves, authored
   against the engine's published authoring surface and exported as portable JSON.

Engine source code stays in the companion repo and is consumed here as the pinned `engine/`
submodule — see *Tooling → Game content* below, and the decision of 2026-08-30 in
`design/90-decisions.md` for why content is owned here rather than in a separate content
repository the way `SubZeroDev.Adventures.Content` is.

**Companions:**
- **Engine** (source + specs): [SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine)
  — the Narrative Engine core/API (`04-core`), the story-graph kind, MVP, and the
  `src/engine/` implementation. These are the contracts this game builds on. Much of what
  it calls "the core" (projection boundary, condition DSL, seeded RNG, tiered validation,
  determinism harness, save/migration) was first designed in the Life in the Fast Lane
  engine spec **here**.
- **Hosting / NEaaS**: [SubZeroDev.Platform](https://github.com/The-Running-Dev/SubZeroDev.Platform).

The docs here reference the engine repo by name (`engine/…`); it references the game
(`games/…`).

The game docs are a **Docusaurus site rooted at `docs/`** (see Tooling → Docs site); the
markdown lives under `docs/docs/games/`.

The build strategy is engine-first: a deterministic, interface-independent engine, proven
by automated tests and a plain text client before any UI. Once the API is proven, UI is
presentation.

### The document sets

Read each set in order. Files are scoped deliberately and cross-reference by section
number.

**Games — `docs/docs/games/`** (the flagship Life spec, the game catalog, shared source)

| File | Holds |
|---|---|
| `docs/docs/games/01-vision.md` | Why the game exists, creative principles, non-goals, risks |
| `docs/docs/games/02-narrative-voice.md` | The narrator, tone rules, long-arc gags. **The project's strongest asset** |
| `docs/docs/games/03-game-design.md` | Mechanics, numbers, content targets, the map, the scenario |
| `docs/docs/games/04-engine-specification.md` | Types, API, systems, testing, phases (~115 KB) |
| `docs/docs/games/05-text-client.md` | The first client, and the instrument that proves the API |
| `docs/docs/games/life-in-the-fast-lane.md` | **Game 1** — the `simulation` kind (Jones clone). Depth milestone; Bulgaria is its culture pack. Full spec is `docs/docs/games/01`–`05` |
| `docs/docs/games/bulgaria-adventure.md` | **Game 2** — the `story-graph` kind (make-your-own-adventure). The MVP vehicle |
| `docs/docs/games/bulgaria.md` | Shared Bulgarian **source scenes** — used by both games, committed to neither's mechanics |

**Engine & hosting — separate repos**

- **Engine** (Narrative Engine — source + specs):
  [SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine) —
  `01-vision`, `02-architecture`, `04-core` (API/types), `03-story-graph-kind`, `MVP`,
  `TODO`, `OPEN-QUESTIONS`, plus the `src/engine/` code. The contracts this game builds on;
  clone it alongside this repo.
- **Hosting / NEaaS**: [SubZeroDev.Platform](https://github.com/The-Running-Dev/SubZeroDev.Platform).

**Numbering is positional.** A new document inserted between existing ones means
renumbering everything after it and rewriting every cross-document link. Prefer
appending unless position genuinely matters.

#### Where drift happens

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

### Tooling

#### Docs site — `docs/` (Docusaurus)

The specs are served as a Docusaurus site. `docs/` is both the Docusaurus project
overlay and the Docker build context:

- `docs/docs/` — the markdown content (`games/`). Numeric filename prefixes drive sidebar
  order.
- `docs/docusaurus.config.ts`, `docs/sidebar.ts` — **local overrides** of the base
  image's defaults (autogenerated sidebar; broken-link checks set to `warn`).
- `docs/Dockerfile` — extends `ghcr.io/the-running-dev/docs-template` and `COPY . .`
  overlays the above onto `/template`. That copy is what overwrites the base config/sidebar.

Run it with **`docs.ps1`** (repo root; needs Docker Desktop running):

| Command | Does |
|---|---|
| `./docs.ps1` | Build the image, run it, serve <http://localhost:3000/docs> |
| `./docs.ps1 -Live` | Same, but bind-mounts `docs/` so edits hot-reload without a rebuild |
| `./docs.ps1 -BuildOnly` | Build the image only |

`-Port`, `-Tag`, `-BaseImage` override the defaults.

**Root `design/` (installed by this kit) is outside `docs/`**, so it is never swept into
the Docusaurus build context or the Docker image — no relocation needed. The same is true of
`src/`, `scripts/`, `content/` and `engine/`: the Docker build context is `docs/`, so nothing
the game-content toolchain adds at the root can reach the image.

#### Game content — `src/campaigns/`, `content/`, `engine/`

The campaign sources are TypeScript, authored against the engine's **published** surfaces and
nothing else: `@the-running-dev/game-engine/authoring` for the builders and source types,
`@the-running-dev/game-engine` for the runtime types a host compiles against. Reaching past
those into engine internals is how a consumer stops being a consumer, and the packed-tarball
boundary in the engine repo exists to make that visible.

`engine/` is a **git submodule** pinned to a commit, and `package.json` resolves the dependency
to `file:engine/src/engine`. It is built from source rather than installed from a registry
because the engine's published version and its `main` diverge — 0.10.0 is in its `package.json`
and the newest tag is `v0.8.0`. Pinning a commit is the only way to say exactly what this
content was authored against.

| Command | Does |
|---|---|
| `npm run setup` | Install and build the engine submodule. Run once after cloning, and after moving the pin |
| `npm run typecheck` | `tsc --noEmit` over `src/` and `scripts/` |
| `npm test` | Vitest over `src/**/*.test.ts` |
| `npm run export:content` | Rebuild the portable JSON in `content/` from `src/campaigns/` |
| `npm run check` | All of the above, then `check:clean` |

After cloning: `git submodule update --init --recursive`, then `npm run setup && npm install`.

**`content/` is generated and committed.** `scripts/check-clean.mjs` fails the build when it
does not match what the sources produce, so a campaign edit and its export land in the same
commit. Never hand-edit a file under `content/`.

**The engine pin moves deliberately, never incidentally.** Bumping it is its own change with
its own reason — a fix or a surface this game needs — and the export is regenerated in the same
commit so any behavioural difference shows up as a JSON diff rather than as a surprise later.

#### graphify — `/graphify`

Personal skill at `~/.claude/skills/graphify/`. Turns the folder into a knowledge
graph with community detection.

**It is expensive.** A full rebuild on this corpus is ~200K input tokens. Four
runs in one session consumed 880K and contributed to hitting a session limit.
Do not run it casually. There is **no current graph** — run `/graphify` to build one. The
corpus here is overwhelmingly **prose** — the spec set — so graphify is almost always on its
expensive path. `src/campaigns/` is TypeScript and takes the free AST route, but it is a few
hundred lines against ~105 KB of specification, so it does not move the cost. Prefer
`--cluster-only` or `query` over full rebuilds.

| Command | Cost | Use when |
|---|---|---|
| `/graphify` | ~200K tokens | Corpus changed substantially |
| `/graphify --update` | proportional to changed files | Small changes — **read the trap below first** |
| `/graphify --cluster-only` | free | Re-examine structure without re-extracting |
| `/graphify query "..."` | small | You have a specific question |

##### TRAP: `--update` destroys cross-file edges

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

##### Other gotchas

- **Shrink guard** — refuses to write when the new graph has fewer nodes.
  Sometimes right, sometimes not. Check *why* it shrank before forcing past it.
  After the docs were renumbered, 207 of 312 old nodes pointed at dead paths and
  the shrink was entirely correct.
- **Token counts** — the Agent tool reports only aggregate `subagent_tokens`,
  with no input/output split, so reports show everything as input.

##### What it is actually good for

Finding **orphaned concepts**. It twice isolated `Opportunity` and
`ScheduledEvent` as single-node communities, which is how their missing
lifecycles were found. It also confirms whether newly-added mechanisms wired in
or landed disconnected — an audit you cannot perform on your own work by reading
it.

The engine **code** (in the companion GameEngine repo) is extracted structurally via AST —
no LLM, nearly free — so graph *that* repo when you need code structure. Graphing prose
(here) is not free.

#### claude-mem

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

#### Two memory systems — do not confuse them

- **claude-mem** — background worker on `localhost:37777`, captures observations
  passively into its own database. Not invoked directly.
- **Claude's file memory** — plain markdown under
  `~/.claude/projects/D--Dropbox-Projects-SubZeroDev-GameOfLife/memory/`,
  written deliberately, loaded each session via `MEMORY.md`.

Independent. Neither affects the other.

Provisional numbers are not decided design. `docs/docs/games/04-engine-specification.md`
§22.2 is the sole register — every provisional number in the corpus is listed there, with why
it is deferred and what would settle it.

## Source of truth

The design docs outrank the code. In precedence order:

1. `design/00-brief.md` — problem, non-goals, definition of done
2. `design/20-contract.md` — invariants, error semantics, and the surface the tree cannot state
3. `design/10-design.md` — architecture, data model, failure modes
4. `design/30-slices.md` — work breakdown and acceptance criteria
5. `design/90-decisions.md` — append-only decision log

If the code contradicts the contract *about meaning* — an invariant no longer held, an error raised under conditions the contract does not describe — that is a defect in one of them. **Stop and say which one you think is wrong. Do not silently reconcile.** A document merely *describing* the tree inaccurately is a different thing and is corrected on the spot; the line between them is drawn in `AGENTS.shared.md`: descriptive drift is corrected where it is found.

Lessons learned the hard way live in [`agent.md`](agent.md) — read it after this file.

## Decision logging

Any choice a future reader would ask "why?" about goes in `design/90-decisions.md` as:

```
### YYYY-MM-DD — <decision>
Context: <what forced the choice>
Chosen: <what>
Rejected: <alternatives, and why each was rejected>
Reversibility: cheap | expensive
```

The rejected alternatives are the point. Without them the next session relitigates the same choice.

## House conventions

- Windows host, projects under `D:\Dropbox\Projects\`. PowerShell Core for scripts (`docs.ps1`, `tools/*.ps1`).
- Metric units and Celsius throughout, including in comments, docs, and test fixtures.
- Raster assets as PNG or JPG. Not WebP.
- UTF-8, LF endings. Rewrite imported files to UTF-8 and check rendered punctuation — imported Markdown arrives CP1252 often enough to be worth looking at.
- Scripts run without interactive confirmation prompts. Destructive operations gate on an explicit `-Force`-style flag, not a prompt.
- Commit messages state what changed and which slice it belongs to. **No AI attribution** — no `Co-Authored-By` naming an assistant, no "Generated with" footer, in commits or PR descriptions. This overrides any default the tooling applies.
- A repository with an established commit-message style keeps it. Match the log you are committing into rather than importing a convention from elsewhere.

## What not to do

- Do not summarise the design docs back at me unless asked.
- Do not add commentary about your reasoning process to the docs.
- Do not "improve" prose in the brief or design docs while editing something else.
- Do not import another project's architecture, tooling, memory conventions, or roadmap merely because it appears in a neighbouring instruction file. Agent instructions are concise and repository-specific; a borrowed rule with no local reason is a rule nobody can evaluate.
