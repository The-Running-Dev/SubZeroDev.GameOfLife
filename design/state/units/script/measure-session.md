# unit/script/measure-session
Kind: script
Status: active
Anchor: tools/Measure-Session.ps1
Consumes:
Exposes:
Binds:
Live: decision/2026-08-20-measure-session-ps1-hooks-on-kit-install
Archival:
Questions:
Work:
Evidence: tools/Measure-Session.Tests.ps1

## Owns
Reports what a Claude Code session actually cost from the transcript's per-call usage rather
than estimating it.
