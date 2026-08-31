# decision/2026-08-31-the-lifecycle-marker-vocabulary-is-reserved-to-the-derived-concept-set
Date: 2026-08-31
Anchor: 2026-08-31 — The `lifecycle-` marker vocabulary is reserved to the derived concept set
Status: accepted

## Claim
A `lifecycle-` region may name only a member of the derived concept set, and one naming anything
else is a `concept` finding — the row is in `design/20-contract.md` § *Checks* and the rule in
§ *Authored records*. A stateless mechanism's lifecycle is documented in ordinary prose, which is
where the full-audit path reads it; a marked region declares a checked obligation, and one whose
subject no check can enumerate declares nothing. The reservation's real value is that a
misspelled concept name is a finding rather than an orphaned region every check skips on a
document the report then calls clean. It is SS15's rule one check over, and carries no `SS` id of
its own.
