# unit/script/invoke-codexcommand
Kind: script
Status: active
Anchor: tools/Invoke-CodexCommand.ps1
Consumes:
Exposes:
Binds:
Live:
Archival:
Questions:
Work:
Evidence: tools/Invoke-CodexCommand.Tests.ps1

## Owns
Maps a command name to the Codex profile (`architect`/`builder`/`quick`) required by
`AGENTS.md`, then invokes Codex with that profile.
