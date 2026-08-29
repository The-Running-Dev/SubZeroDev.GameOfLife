# decision/2026-08-29-six-ss-invariants-gain-the-tests-their-enforcement-column-already-claimed
Date: 2026-08-29
Anchor: 2026-08-29 — Six SS invariants gain the tests their Enforcement column already claimed
Status: accepted

## Claim
Write the missing tests, so the code side moves to meet the contract rather than the contract being downgraded to match the tree. Each assertion was verified by mutation rather than by passing, per *Verification*: adding a regex operator, a `-Fix` parameter, an `-EnginePath` parameter, a `Set-Content` call, a file redirection, a closure parameter, dropping the git stamp, and unclosing a corpus marker each fail exactly their own test and nothing else. Suite 343/343, from 333. Two of the assertions were written wrong first and corrected against what the tree actually guarantees: `2>$null` is a stream discard rather than a write, and an inline region body puts visible prose on the same line as its markers, so neither "no redirection at all" nor "the marker owns its line" was the right rule.
