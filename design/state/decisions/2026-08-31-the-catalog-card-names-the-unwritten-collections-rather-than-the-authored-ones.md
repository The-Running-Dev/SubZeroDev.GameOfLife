# decision/2026-08-31-the-catalog-card-names-the-unwritten-collections-rather-than-the-authored-ones
Date: 2026-08-31
Anchor: 2026-08-31 — The catalog card names the unwritten collections rather than the authored ones
Status: accepted

## Claim
A campaign's `contentNotice` names the collections that are unwritten, never an enumeration of
what is authored, and `src/campaigns/stable-life.test.ts` asserts it names exactly the empty
collections and none of the others. An enumeration has to be revised by every slice that fills a
collection and was not: the published card read "15 of 30 random events" through four merged
slices after all 30 were written, in the sentence `20-contract.md` § *Content path records* makes
a content-fitness statement rather than a presentation flag. The set of empty collections only
shrinks and is already asserted by the same suite, so the notice is checked against a set instead
of against counts a slice has to remember.
