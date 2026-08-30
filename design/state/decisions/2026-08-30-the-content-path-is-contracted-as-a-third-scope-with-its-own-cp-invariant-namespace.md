# decision/2026-08-30-the-content-path-is-contracted-as-a-third-scope-with-its-own-cp-invariant-namespace
Date: 2026-08-30
Anchor: 2026-08-30 — The content path is contracted as a third scope with its own CP invariant namespace
Status: accepted

## Claim
The content path is a third standing contract scope in `design/20-contract.md`, its invariants
carry the `CP` prefix, and they are hand-authored beside the `SS` rows rather than materialised
as `design/state/invariants/*.md` records. Recording them would require `src/campaigns/` and
`scripts/` to become a globbed unit kind, which is the installed design-state path's policy and
not the content path's to change; it would also raise `EnforcementUnevidenced` on every row
asserting an enforcement no slice has yet written. The `CP` table carries an `Evidence` column
the `SS` table lacks, so a `Code` row nothing enforces is visible per row rather than only in a
header sentence.
