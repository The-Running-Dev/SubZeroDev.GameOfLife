# unit/script/test-designstate
Kind: script
Status: active
Anchor: tools/Test-DesignState.ps1
Consumes: contract/read-designstate, contract/update-designprojection
Exposes: contract/test-designstate
Binds: I15, I16, I18, I19, I20, I21, I23, I30, I31
Live: decision/2026-08-25-s18-6-derives-its-freeze-dependent-expectation-instead-of-pinning-it
Archival:
Questions:
Work:
Evidence: tools/Test-DesignState.Tests.ps1

## Owns
The design-state divergence checker: validator, projection checker, budget meter, freeze gate,
and the three-list report.
