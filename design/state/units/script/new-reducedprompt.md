# unit/script/new-reducedprompt
Kind: script
Status: active
Anchor: tools/New-ReducedPrompt.ps1
Consumes:
Exposes:
Binds:
Live:
Archival:
Questions:
Work:
Evidence: tools/New-ReducedPrompt.Tests.ps1

## Owns
Assembles a reduced-context prompt for one slice — the slice's own block, `design/20-contract.md`
verbatim, and only the `AGENTS.md` sections `.claude/commands/slice.md` cites as binding a
slice — for a target model with less context than the full `/slice` prompt assumes.
