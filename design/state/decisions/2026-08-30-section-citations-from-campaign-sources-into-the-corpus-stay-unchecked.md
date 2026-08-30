# decision/2026-08-30-section-citations-from-campaign-sources-into-the-corpus-stay-unchecked
Date: 2026-08-30
Anchor: 2026-08-30 — Section citations from campaign sources into the corpus stay unchecked
Status: accepted

## Claim
Campaign sources cite the corpus by section number, no program resolves those citations, and
their rot after a renumbering is the full-audit path's to catch. The spec-set checker keeps one
corpus root; widening it to read `src/` would make the corpus's checker depend on the corpus's
consumer and is a contract amendment rather than a design preference.
