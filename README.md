# SubZeroDev.GameOfLife

**Life in the Fast Lane** — a satirical weekly life-sim in the lineage of *Jones in the
Fast Lane* (Sierra, 1990) — plus the **reference implementation** of the deterministic
narrative engine it runs on.

It is the flagship `simulation`-kind game of the Narrative Engine platform. The build
strategy is **engine-first**: a deterministic, interface-independent engine, proven by
automated tests and a plain text client before any UI.

> **The platform (engine) *specs* live in the companion project,**
> [SubZeroDev.NarrativeEngine](https://github.com/The-Running-Dev/SubZeroDev.NarrativeEngine)
> — architecture, the core/API, the story-graph kind, MVP, hosting. This repo holds the
> **game** and the **engine code**.

## What's here

| Path | What |
|---|---|
| [`docs/docs/games/`](docs/docs/games/) | The game specs — the full Life in the Fast Lane spec (`01`–`05`), the game catalog, and the shared Bulgarian source scenes |
| [`src/engine/`](src/engine/) | The engine implementation (TypeScript strict, vitest, determinism-guard eslint) — Phase 1 core: seeded PCG32 + canonical serialization, verified bit-identical to reference vectors |
| `docs/` | The game docs are a Docusaurus site; `docs/docs/` is its content root |
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

1. [Game vision](docs/docs/games/01-vision.md) — why the game exists
2. [Narrative voice](docs/docs/games/02-narrative-voice.md) — the narrator (the project's strongest asset)
3. [Game design](docs/docs/games/03-game-design.md) — mechanics, numbers, the scenario
4. [Engine specification](docs/docs/games/04-engine-specification.md) — the simulation kind in full
5. [Text client](docs/docs/games/05-text-client.md) — the first client, the API's proving ground

For the platform itself, see the companion
[SubZeroDev.NarrativeEngine](https://github.com/The-Running-Dev/SubZeroDev.NarrativeEngine).

---

Private, work in progress.
