# decision/2026-09-01-the-content-path-s-gates-use-a-two-value-exit-and-only-never-0-is-contracted
Date: 2026-09-01
Anchor: 2026-09-01 — The content path's gates use a two-value exit, and only "never 0" is contracted
Status: accepted

## Claim
`scripts/check-clean.mjs` exits 1 for both `ExportStale` and `GitUnavailable`, where every
PowerShell tool in this repository reserves 2 for *could not evaluate*. That is deliberate and
now recorded rather than left to look like an oversight. CP13 contracts one thing — no
content-path step exits 0 for a comparison or a build it could not make — and a two-value exit
satisfies it. Nothing consumes the distinction: CI chains the steps with `&&`, `package.json`'s
composed `check` does the same, and `/verify` reports a discovered gate by its step name and
whether it passed. What SS5's split protects is a reader's action, and on this path both non-zero
cases have the same one — read the message, which names `ExportStale` or `GitUnavailable` in as
many words.
