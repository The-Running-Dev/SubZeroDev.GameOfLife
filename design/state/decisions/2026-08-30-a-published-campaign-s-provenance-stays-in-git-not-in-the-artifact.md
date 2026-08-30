# decision/2026-08-30-a-published-campaign-s-provenance-stays-in-git-not-in-the-artifact
Date: 2026-08-30
Anchor: 2026-08-30 — A published campaign's provenance stays in git, not in the artifact
Status: accepted

## Claim
Which engine produced a published artifact is answered by the commit that published it and the
submodule pin recorded in that commit. Nothing under `content/` records it, no sidecar carries
it, and the manifest is not extended to hold it — the manifest's shape is the engine's published
type, so a provenance field there is an engine change made in the engine repository.
