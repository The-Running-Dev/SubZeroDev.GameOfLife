# SubZeroDev.GameOfLife

**Life in the Fast Lane** — a satirical weekly life-sim in the lineage of *Jones in the
Fast Lane* (Sierra, 1990). The **game specs** for the flagship `simulation`-kind game of
the Narrative Engine.

> **Companions.** The **engine** (source + specs) lives in
> [SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine); the
> deferred **hosting / NEaaS** layer in
> [SubZeroDev.Platform](https://github.com/The-Running-Dev/SubZeroDev.Platform). This repo
> is the game only.

## What's here

| Path | What |
|---|---|
| [`docs/docs/games/`](docs/docs/games/) | The game specs — the full Life in the Fast Lane spec (`01`–`05`), the game catalog, and the shared Bulgarian source scenes |
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

## Where to start reading

1. [Game vision](docs/docs/games/01-vision.md) — why the game exists
2. [Narrative voice](docs/docs/games/02-narrative-voice.md) — the narrator (the project's strongest asset)
3. [Game design](docs/docs/games/03-game-design.md) — mechanics, numbers, the scenario
4. [Engine specification](docs/docs/games/04-engine-specification.md) — the simulation kind in full
5. [Text client](docs/docs/games/05-text-client.md) — the first client, the API's proving ground

For the engine itself (source + specs), see the companion
[SubZeroDev.GameEngine](https://github.com/The-Running-Dev/SubZeroDev.GameEngine).

---

Private, work in progress.
