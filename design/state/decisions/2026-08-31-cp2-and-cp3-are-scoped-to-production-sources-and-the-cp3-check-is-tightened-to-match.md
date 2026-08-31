# decision/2026-08-31-cp2-and-cp3-are-scoped-to-production-sources-and-the-cp3-check-is-tightened-to-match
Date: 2026-08-31
Anchor: 2026-08-31 — CP2 and CP3 are scoped to production sources, and the CP3 check is tightened to match
Status: accepted

## Claim
CP2 and CP3 constrain production sources, not every file in the repository. A test may write
under `content/` to prove the exporter reclaims what the catalog does not name, and may read a
published file to perturb and restore it so `ExportStale` is shown firing against the directory
the gate guards; neither changes the relationship between the sources and what a host fetches,
which is what the two rows protect. The scope is stated in `design/20-contract.md`
§ *Content path invariants* together with the obligation it carries — a test that leaves
`content/` differing from the committed export has failed — rather than living in a code comment
as CP2's half did. `src/published-surface.test.ts` resolves each file's local path bindings to a
fixed point so a read through an identifier built from a `"content"` segment is caught however
far from the literal it sits, and carries a negative case proving it rejects that form.
