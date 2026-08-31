# decision/2026-08-31-a-length-narrowing-on-a-collection-field-is-cp10-compliant-s21-3-is-fully-met
Date: 2026-08-31
Anchor: 2026-08-31 — A `.length` narrowing on a collection field is CP10-compliant; S21.3 is fully met
Status: accepted

## Claim
A condition narrowed to a collection field's own `.length` (an aggregate cardinality check that
resolves without throwing, verified directly against the pinned engine) is the same
narrow-and-name shape CP10 already accepts for S16.5, not the silent approximation CP10 forbids.
`event-friend-needs-a-favor` and `event-tutor-offers-extra-session` condition on
`player.relationships.length`/`player.education.enrollments.length` on this basis, so S21.3's
three required conditions — housing, an NPC relationship, a course in progress — are all
expressible and tested.
