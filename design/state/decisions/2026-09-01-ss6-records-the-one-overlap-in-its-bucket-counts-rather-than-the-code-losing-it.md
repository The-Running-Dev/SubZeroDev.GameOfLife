# decision/2026-09-01-ss6-records-the-one-overlap-in-its-bucket-counts-rather-than-the-code-losing-it
Date: 2026-09-01
Anchor: 2026-09-01 — SS6 records the one overlap in its bucket counts rather than the code losing it
Status: accepted

## Claim
SS6 no longer claims every subject is in exactly one bucket, because one is not: a
cross-repository reference missing its pinned sha is counted as `Unresolvable` and, because it
carries a finding, as `Failed`. The row now states that overlap and keeps its enforcement an
equality by subtracting it, which is possible only because the overlap is closed — exactly one
shape produces it, and a second is a contract amendment rather than a counting detail. The
alternative was to change `Get-SpecSetBucketCounts` so nothing overlaps; it is recorded as known
and retained rather than dropped, because it reads better against SS9 and was the recommendation.
What decided against it is that the reference's `Status` is already `Unresolvable` and never
`Failed`, so SS9 was never violated by the tree — only the row's own sentence was wrong about it.
`S4.6` now exercises the overlap on a fixture as well as its absence on the real corpus, where
every cross-repository reference is pinned and the case cannot arise.
