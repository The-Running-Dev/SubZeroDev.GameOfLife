# decision/2026-09-01-ss10-names-the-result-object-not-the-printed-report-line
Date: 2026-09-01
Anchor: 2026-09-01 — SS10 names the result object, not the printed report line
Status: accepted

## Claim
"The report" named two surfaces in one table: SS16 and SS18 are asserted against the line
`Write-SpecSetReport` emits, and SS10 against the result object. SS10 now says "the result
object", matching what `Get-SpecSetGitInfo` populates and what `S1.6` asserts. The two surfaces
are different and deliberately so — `-Quiet` suppresses the line and can never suppress the
object, which is why the commit and the tree state belong on the object rather than on a line a
parameter can remove. No code and no test changed; neither was wrong, and the risk being removed
is that a later reader compares SS10 against the printed line and closes a gap that does not
exist.
