# unit/script/test-designstate
Kind: script
Status: active
Anchor: tools/Test-DesignState.ps1
Consumes: contract/read-designstate, contract/update-designprojection
Exposes: contract/test-designstate
Binds: I15, I16, I18, I19, I20, I21, I23, I30, I31
Live:
Archival:
Questions:
Work:
Evidence: tools/Test-DesignState.Tests.ps1

## Owns
The design-state divergence checker: validator, projection checker, budget meter, freeze gate,
and the three-list report.
