# decision/2026-08-30-the-game-content-path-enters-design-through-a-design-pass-before-it-is-contracted-or-sliced
Date: 2026-08-30
Anchor: 2026-08-30 — The game-content path enters `design/` through a design pass before it is contracted or sliced
Status: accepted

## Claim
The game-content path — the campaign sources, the exported JSON, the export and clean-check
scripts, and the pinned engine submodule — is designed before it is contracted, and contracted
before it is sliced. `10-design.md` gains it as a third system, carrying the failure modes and
the module boundary that no other document in the repository has a place for; `20-contract.md`
then gains a third contract scope holding the invariants CI already enforces. Slices for the
unwritten content collections are derived only after both, because a slice may introduce no
signature the contract does not carry, and until then `30-slices.md` § *Outstanding* stays
empty rather than being filled with work derived from documents that do not describe it.
