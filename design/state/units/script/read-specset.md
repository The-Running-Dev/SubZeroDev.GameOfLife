# unit/script/read-specset
Kind: script
Status: active
Anchor: tools/Read-SpecSet.ps1
Consumes:
Exposes:
Binds:
Live:
Archival:
Questions:
Work:
Evidence: tools/Read-SpecSet.Tests.ps1

## Owns
Reads the game-spec corpus into derived document and declaration records, failing closed on
an unsupported declaration rather than returning a partial index.
