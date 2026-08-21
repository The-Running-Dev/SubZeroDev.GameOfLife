# unit/script/read-specset
Kind: script
Status: active
Anchor: tools/Read-SpecSet.ps1
Consumes:
Exposes:
Binds:
Live: decision/2026-08-20-no-enginepath-cross-repository-references-are-permanently-unchecked, decision/2026-08-20-tooling-is-in-scope-the-checker-is-powershell-in-tools, decision/2026-08-20-two-files-with-the-module-boundaries-enforced-by-ast-inspection, decision/2026-08-20-typed-classes-for-the-records-pscustomobject-for-the-result-envelope, decision/2026-08-20-spec-set-invariants-derived-from-the-prose-not-from-a-sidecar, decision/2026-08-20-restricted-grammar-that-fails-loudly-not-a-typescript-parser, decision/2026-08-20-closure-distinguishes-a-mirror-obligation-from-content
Archival:
Questions:
Work:
Evidence: tools/Read-SpecSet.Tests.ps1

## Owns
Reads the game-spec corpus into derived document and declaration records, failing closed on
an unsupported declaration rather than returning a partial index.
