# unit/script/sync-kit
Kind: script
Status: active
Anchor: tools/Sync-Kit.ps1
Consumes: contract/test-companion
Exposes:
Binds:
Live:
Archival:
Questions:
Work:
Evidence: tools/Sync-Kit.Tests.ps1

## Owns
Syncs kit-owned command and tool files into a target repository against the target's recorded
install commit without overwriting unresolved local divergence.
