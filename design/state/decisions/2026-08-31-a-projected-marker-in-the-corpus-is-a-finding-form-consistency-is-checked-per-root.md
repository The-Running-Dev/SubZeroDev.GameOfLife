# decision/2026-08-31-a-projected-marker-in-the-corpus-is-a-finding-form-consistency-is-checked-per-root
Date: 2026-08-31
Anchor: 2026-08-31 — A projected marker in the corpus is a finding; form consistency is checked per root
Status: accepted

## Claim
A marker written in the projected form anywhere in the corpus is `MalformedRegion`. The corpus has
no projector — SS1 makes every module read-only — so a rendered region cannot legitimately appear
there, and leaving it merely unrecognised let a region disappear silently: dropping `:declared:`
from both of a region's markers retired its obligation on a run that still reported `Valid`. A
both-forms collision rule would not have caught that, because the id then never appears in
declared form at all. `MalformedRegion` absorbs the case rather than a new reason being minted,
on the reasoning that widened `AnchorMissing` and `EnforcementUnevidenced`. Form consistency is
checked per root: `IdCollision` over the design-state document set, the spec-set index over the
corpus, and an id declared in one and projected in the other is reached by neither — CP9 keeps
the spec-set checker to a single corpus root, so `20-contract.md` names that bound instead of
claiming a reach it does not have.
