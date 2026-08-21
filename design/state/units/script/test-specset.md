# unit/script/test-specset
Kind: script
Status: active
Anchor: tools/Test-SpecSet.ps1
Consumes:
Exposes:
Binds:
Live: decision/2026-08-20-04-22-2-is-the-sole-provisional-register-and-every-row-carries-a-settling-condition, decision/2026-08-22-the-8-7-housing-quality-row-s-settling-condition-is-the-simulation-harness, decision/2026-08-20-a-concept-is-a-state-bearing-entity, decision/2026-08-20-the-checker-is-a-ci-gate-and-a-finding-fails-the-build, decision/2026-08-20-two-files-with-the-module-boundaries-enforced-by-ast-inspection, decision/2026-08-20-typed-classes-for-the-records-pscustomobject-for-the-result-envelope, decision/2026-08-20-mirror-obligations-declared-not-inferred-from-prose, decision/2026-08-20-the-checker-is-read-only-and-a-verification-gate-rather-than-a-hook-or-ci
Archival: decision/2026-08-20-marker-vocabulary-four-declared-id-forms-visible-bodies-one-corpus-wide-namespace
Questions:
Work:
Evidence: tools/Test-SpecSet.Tests.ps1

## Owns
Runs the spec-set checks over the derived index, reports findings and unchecked work, and maps
the result to the contracted exit status.
