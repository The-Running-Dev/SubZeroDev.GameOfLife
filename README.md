# SubZeroDev.GameOfLife

A deterministic **narrative-game platform** and its flagship game, built spec-first.

Two things live here:

1. **Narrative Engine** — a game-agnostic platform. The model is **core → kinds →
   campaigns**: one shared deterministic core, game-*type* logic (`kinds`), and content
   (`campaigns`) as data. v1 ships two kinds — `story-graph` (flagship) and `simulation`.
2. **Life in the Fast Lane** — a satirical weekly life-sim in the lineage of *Jones in the
   Fast Lane* (Sierra, 1990). It is the engine's flagship `simulation`-kind game.

The build strategy is **engine-first**: a deterministic, interface-independent engine,
proven by automated tests and a plain text client before any UI.

## Status

- **Specs:** the MVP contracts are finalized — the story-graph kind
  ([`03`](docs/docs/engine/03-story-graph-kind.md)) and the core
  ([`04-core`](docs/docs/engine/04-core.md)). See [MVP.md](docs/docs/engine/MVP.md).
- **Code:** Phase 1 core started in [`src/engine/`](src/engine/) — seeded PCG32 RNG and
  canonical serialization, verified bit-identical to reference vectors. Next: the pure
  engine `advance(state, action) → state`.
- **Open items:** tracked in
  [OPEN-QUESTIONS.md](docs/docs/engine/OPEN-QUESTIONS.md) (the sharpest: `PlayerProfile`
  isn't part of the core yet).

## Layout

| Path | What |
|---|---|
| [`docs/docs/engine/`](docs/docs/engine/) | Platform specs — architecture, the core (`04-core`), the story-graph kind, MVP, TODO, open questions |
| [`docs/docs/games/`](docs/docs/games/) | The games — the full Life in the Fast Lane spec (`01`–`05`), the game catalog, shared Bulgarian source |
| [`src/engine/`](src/engine/) | The engine implementation (TypeScript strict, vitest, determinism-guard eslint) |
| `docs/` | The docs are a Docusaurus site; `docs/docs/` is its content root |
| [`docs.ps1`](docs.ps1) | Build & serve the docs site |
| [`CLAUDE.md`](CLAUDE.md), [`agent.md`](agent.md) | Working instructions and hard-won lessons for anyone (human or agent) on this project |

## The docs are a website

The specs render as a [Docusaurus](https://docusaurus.io) site (base image
`ghcr.io/the-running-dev/docs-template`, overlaid with the local config). Requires Docker
Desktop.

```powershell
./docs.ps1            # build + serve at http://localhost:3000/docs
./docs.ps1 -Live      # + hot-reload while editing docs/
./docs.ps1 -BuildOnly # build the image only
```

## Developing the engine

```bash
cd src/engine
npm install
npm test        # vitest
npm run lint    # determinism guard + typescript-eslint
npm run typecheck
```

Determinism is enforced, not hoped for: the eslint config bans `Math.random`, the
non-bit-stable `Math.*` functions, and `Date.now` in `src/`, and the core replays
byte-for-byte from a seed and its inputs.

## Where to start reading

1. [Platform vision](docs/docs/engine/01-vision.md) — why the platform exists
2. [Architecture](docs/docs/engine/02-architecture.md) — every settled decision
3. [The core](docs/docs/engine/04-core.md) — the platform as types
4. [Story-graph kind](docs/docs/engine/03-story-graph-kind.md) — the flagship content model
5. [MVP](docs/docs/engine/MVP.md) + [TODO](docs/docs/engine/TODO.md) — what ships first, in order

---

Private, work in progress.
