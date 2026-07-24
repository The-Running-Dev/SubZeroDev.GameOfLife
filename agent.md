# Agent — Lessons Learned

Retrospective notes for whoever (human or agent) works this project next. Standing
*instructions* live in [`CLAUDE.md`](CLAUDE.md); durable *facts/preferences* live in the
memory dir. This file is what we learned the hard way.

Keep this file short — it loads into context, so length is a recurring cost. Add a
lesson only when it would have changed a decision.

---

## Token economy (read this first)

This project burns tokens fast. The sinks, largest first:

1. **graphify is ~80% of discretionary spend.** Four runs in one session ≈ 880K tokens,
   plus its ~15K-token skill prompt pasted on every invocation. On a small **prose**
   corpus its value is marginal — reading the docs directly found 12 inconsistencies;
   graphify found ~2. **Do not run it on the specs.** It becomes worth it only once
   TypeScript exists (AST extraction is free — no LLM). Until then use `--cluster-only`
   (free) or `query`; never full rebuilds. (Details + the `--update` trap: `CLAUDE.md`.)
2. **Skill prompts inject their whole instruction file** on invocation. Only invoke a
   skill you will actually use.
3. **Full-file reads and large specs.** The engine spec is ~104KB (~30K tokens/read).
   `learn-codebase` reads everything — worth it occasionally, not routinely. Prefer
   grep / offset-limit when you know what you need.
4. **Start a fresh session at phase boundaries.** Long sessions carry everything
   forward. `CLAUDE.md` + memory + the docs re-prime a new session cheaply — that's why
   they're kept tight.

---

## What worked (keep doing)

- **Decide via questions, then batch-write.** Surface real forks one/few at a time with
  `AskUserQuestion` (recommended option first), get sign-off, *then* edit docs. Never
  bulk-apply findings unreviewed. The user routinely picks the non-recommended option
  (and the more rigorous one) — so ask, don't assume.
- **Verify, don't assert.** Running the PCG32 code in Node caught a golden-test vector I
  had written from memory (`5cae1c8b` → actually `cbed606e`). Assert only what you have
  checked. Report failures plainly.
- **Spec before code.** Building ahead of spec is where drift starts. When asked to
  "keep going" into code, we stopped and wrote the core spec first — which
  immediately exposed that `03`'s state duplicated envelope fields. That reconciliation
  would have been a bug in the implementation otherwise.
- **Full read after many small edits.** Editing a large spec from diffs accumulates
  drift that only a full read catches (`learn-codebase` found 12, incl. a functional bug
  where `DerivedPath` omitted `world.strangeness`).

## Drift hazards specific to this project

- **`docs/docs/games/03` ↔ `docs/docs/games/04`** drift most (the engine `03`↔`04` pair
  is in the companion platform repo): one is an implementation-of the other. When a type
  changes, update the prose, the examples, the projection, and the test list too.
- **Envelope-duplication drift recurs.** The `kindState` reconciliation (03 §8.1) had a
  twin found later: `StoryGraphCampaign` (03 §1) duplicated `id`/`version`/`titleKey`/
  `strings` that belong on the core `Campaign`/registry (04-core §10.1). When a
  kind mirrors a core concept (state, campaign, …), check the identity fields live in
  exactly one place — the envelope, not the kind.
- **Two docs called "memory"** — claude-mem (background worker) vs Claude's file memory.
  Independent. Don't conflate.
- **Positional numbering** — inserting a doc means renumbering + rewriting every link.
  Prefer appending.
- **Encoding**: some imported source docs arrived CP1252, not UTF-8 — em-dashes and
  arrows render as mojibake. Rewrite to UTF-8 when importing.

## Open concerns & assumptions

- **Spec-level unknowns** live in the companion platform repo's `OPEN-QUESTIONS.md`
  ([SubZeroDev.NarrativeEngine](https://github.com/The-Running-Dev/SubZeroDev.NarrativeEngine)).
  The sharpest: `PlayerProfile` — needed by the MVP achievement DoD — is defined only in
  the simulation kind, not the core. Resolve before Phase 2 achievements.
- **The docs-site base image is unverified.** `docs.ps1` builds on
  `ghcr.io/the-running-dev/docs-template`; we *assume* it ships `@docusaurus/preset-classic`
  (v3), serves on port 3000, and accepts `sidebar.ts`. `COPY` can't delete, so leftover
  template sample docs may show in the sidebar; the base image's `caniuse-lite` is stale.
  All confirmed *only* against one local run — re-verify if the base image changes.
- **Engine suite is Node-verified only**, not yet run through vitest/CI (`TODO.md` Phase 1).

## Orientation in one paragraph

This repo = **Life in the Fast Lane** (`docs/docs/games/`, a Jones-clone life-sim = the
`simulation` kind) + the **engine implementation** (`src/engine/`, Phase 1 core started).
The **platform specs** are the companion repo
[SubZeroDev.NarrativeEngine](https://github.com/The-Running-Dev/SubZeroDev.NarrativeEngine):
a game-agnostic **core** + **kinds** (engine-owned code) + **campaigns** (data); v1 ships
two kinds, `story-graph` (flagship, the MVP) and `simulation`. A "campaign" is a kind + its
data; a "culture pack" reskins a simulation campaign. Bulgaria is *two different games* — a
culture pack on Jones, and a story-graph make-your-own-adventure — not one thing. Build
order: core → story-graph kind → minimal Bulgaria adventure → text client + MCP = MVP.
Then depth (Jones). Hosting/SaaS deferred. Contracts (companion repo): `04-core.md`
(types), `02-architecture.md` (decisions).
