# decision/2026-08-30-life-in-the-fast-lane-s-campaign-content-is-owned-in-this-repository-not-in-a-separate-content-repository
Date: 2026-08-30
Anchor: 2026-08-30 — Life in the Fast Lane's campaign content is owned in this repository, not in a separate content repository
Status: accepted

## Claim
This repository owns both halves of the game: the spec set under `docs/docs/games/` and the
campaign sources under `src/campaigns/`, exported as portable JSON to `content/`. The engine is
a dependency, consumed as the pinned `engine/` submodule through its published root and
`/authoring` surfaces; engine source code remains a permanent non-goal and the brief's non-goal
is narrowed to say so precisely. The separate-content-repository shape used by
`SubZeroDev.Adventures.Content` is deliberately not adopted here, because that repository serves
a consumer owning no spec set, whereas here the specs and the content are one artifact seen
twice — and a repository boundary between them would put the fastest-drifting pair in the corpus
out of reach of the checker built to hold it together.
