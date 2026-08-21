# decision/2026-08-20-two-files-with-the-module-boundaries-enforced-by-ast-inspection
Date: 2026-08-20
Anchor: 2026-08-20 — Two files, with the module boundaries enforced by AST inspection
Status: accepted

## Claim
`tools/Read-SpecSet.ps1` holds Corpus access and Index; `tools/Test-SpecSet.ps1` holds Checks, Report and Runner and dot-sources the reader. This matches the repository's existing `Read-DesignState.ps1` / `Test-DesignState.ps1` split for the same shape. SS2, SS3 and SS4 are then enforced by parsing the scripts with `[System.Management.Automation.Language.Parser]` — the same mechanism the kit's CI recipe already uses for its parse-check — and asserting no match operator outside the reader and no file cmdlet inside a check function.
