# Slices

Derived from [`10-design.md`](10-design.md) and [`20-contract.md`](20-contract.md). The systems
sliced here are the **spec-set checker**, the **marker vocabulary** the corpus carries for it, the
repository-local migration of the installed **design-state mechanism**, and — since the 2026-08-30
design and contract passes — the **content path**: the campaign sources, the exporter, the clean
check, and the pinned engine they are authored against. The engine is still not sliced here. The
game's *content* now is, because this repository owns it.

**System 1's riskiest assumption was the restricted grammar.** `90-decisions.md` (2026-08-20,
restricted grammar) bets that PowerShell pattern-matching can extract the corpus's 154 top-level
declarations out of 72 TypeScript fences *and decide closure* without a TypeScript compiler, and it
accepts a Node runtime as the reversal if that bet fails. S1 does nothing else, so the bet is
settled in the first slice against the real 104 KB `04-engine-specification.md` rather than
discovered in the fourth.

Its second bet is that a **declared** mirror obligation plus derived closure produces a check worth
reading — `90-decisions.md` (2026-08-20, mirror obligations declared / closure). S3 proves it on
the exact defect the brief names, by removing `wisdom` again and watching the check fail.

**System 2's riskiest assumption is that the pinned engine's published surface can express what
`03` §16.1 asks for, and it has already failed once.** `10-design.md` § *Control flow* path 6
records the failure: a completion requirement in `03` §16.3 needs a condition over a collection,
and the condition language implements only scalar fields. `03` §11.3 asks for the same thing
again, of every event. So the authoring slices are ordered to meet that surface early — S15 takes
the largest single system in `03`, and S16 takes the condition-bearing content — rather than
discovering in the eighth slice how much of the corpus the surface cannot carry. What it cannot
carry is omitted visibly and named (CP10); it is never approximated.

**S12 lands before any authoring slice, and that ordering is deliberate.** It is one test file and
a fraction of a session, and every campaign source written after it is written under the guard
instead of audited for compliance afterwards — which matters because CP1 is the one invariant in
either system whose violation looks exactly like success.

One thing a reader should know before working through the set:

- **S6 lands with the gate red and S7 clears it.** The concept check counts what the brief's
  fourth condition is missing before anyone starts closing it, which is deliberate: a count
  produced after the fixing has begun is not a measurement.

`/track` should be run after this document is reviewed. **Do not open issues from here.**

## How this document is kept

**A slice's full body lives here only until it lands.** Once its issue is closed the body is
retired to the index under `## Landed`, which keeps the name, the issue number, and the commit the
body was last complete at. Nothing is lost — `git show <sha>:design/30-slices.md` returns it, and
the issue's agent block still pins `design/30-slices.md § S<n> @ <sha>` for its own criteria.

**`/slices` appends new slices under `## Outstanding`.** Never renumber, and never reuse a retired
id — criterion ids are cited by issue checkboxes, and `tools/Test-DesignDrift.ps1` compares on ids
rather than prose, so a renumbered id silently rewrites what an existing checkbox refers to.
Removing a criterion leaves a gap.

## Resolved contract questions

Both were raised here, both were answered by an amendment on 2026-08-23, and both are recorded in
full in [`90-decisions.md`](90-decisions.md). They are kept as pointers rather than deleted because
the shape of S4 only makes sense against the fork it came out of.

**1. The checker's steady state was exit 2, so CI would have been red forever.** Settled by
*An unresolvable subject is not an unchecked run; SS5 splits the list*. One word was doing two
jobs: *unchecked* now means only a degraded run — environmental, unintended, fixable — and still
forces exit 2, while a second list, *unresolvable*, holds a check that completed against a subject
a recorded decision placed out of reach. `CrossRepositoryUnresolvable` moved there, so the corpus's
8 references into SubZeroDev.GameEngine are counted and named on every run without ever changing
run status. New SS18 is what stops that becoming a hole: a run reporting `Valid` must still name
its unresolvable count. **S4 is unblocked**, and S4.3, S4.5, S4.6, S4.7 and S4.8 are what it is
unblocked into.

**2. A mirror obligation is all-or-nothing.** Settled by *A mirror obligation is all-or-nothing,
and the bound is recorded rather than widened*. No amendment to the check and no new marker form:
`20-contract.md` § *Authored records* now states that a site describing a subset is not a weak
obligation but not an obligation at all. The consequence is a bound rather than a defect — this
machinery covers the brief's second condition where `03`'s prose is already exhaustive and nowhere
else, and S3's two sites remain the whole obligation set.

## Landed

Bodies retired per *How this document is kept*. `git show <sha>:design/30-slices.md` returns each
in full, and each issue's agent block still pins its own criteria.

| Slice | Name | Issue | Criteria | Body complete at |
|---|---|---|---|---|
| S1 | The spec set is read end to end, or the run stops and points at the line | #8 | S1.1–S1.10 | `394505a` |
| S2 | Every push runs the checks | #9 | S2.1–S2.5 | `394505a` |
| S3 | The two documents stop being able to disagree about the types they both describe | #10 | S3.1–S3.10 | `394505a` |
| S5 | Every provisional number says why it is deferred and what would settle it | #12 | S5.1–S5.6 | `394505a` |
| S4 | Every reference resolves, and every claim about the engine repository pins a commit | #11 | S4.1–S4.8 | `86fc538` |
| S6 | Everything the game keeps in state is counted, and told what it must say | #13 | S6.1–S6.5 | `394505a` |
| S7 | The missing lifecycles are written | #14 | S7.1–S7.3 | `394505a` |
| S8 | Every command can be read as one connected record | #24 | S8.1–S8.7 | `2c02151` |
| S9 | Every checked script and standing document can be read as one connected record | #22 | S9.1–S9.6 | `2c02151` |
| S10 | Every local rule and logged decision becomes addressable | #25 | S10.1–S10.8 | `2c02151` |
| S11 | The local design state reaches a checked fixed point | #23 | S11.1–S11.7 | `2c02151` |
| S12 | Nothing reaches past the engine's published surface, and nothing reads the published output | #80 | S12.1–S12.6 | `79da1c8` |
| S13 | A failed export cannot leave half a catalog published, and a retired campaign disappears | #81 | S13.1–S13.5 | `79da1c8` |
| S14 | The content gate cannot be relaxed, reordered, or made to pass without running | #82 | S14.1–S14.6 | `79da1c8` |
| S15 | There is work to take, and a way up from it | #83 | S15.1–S15.7 | `79da1c8` |
| S16 | Weeks stop being identical: work, money and paperwork go wrong on their own | #84 | S16.1–S16.6 | `79da1c8` |
| S17 | Education is something a player can actually buy, attend, and fail | #85 | S17.1–S17.6 | `79da1c8` |
| S18 | There is somewhere better to live, and a bill for staying there | #86 | S18.1–S18.5 | `79da1c8` |
| S19 | A player can spend money on something other than survival | #87 | S19.1–S19.5 | `79da1c8` |
| S20 | There are other people, and they remember | #88 | S20.1–S20.6 | `79da1c8` |
| S21 | The rest of the week goes wrong too: home, health, people and pure absurdity | #89 | S21.1–S21.6 | `79da1c8` |
| S22 | A player does not start from nowhere | #90 | S22.1–S22.6 | `79da1c8` |
| S23 | The scenario is finishable, and there is more than one thing to aim at | #91 | S23.1–S23.6 | `79da1c8` |

## Outstanding

None. The twelve content-path slices (S12–S23) that stood here are all landed — retired above,
`git show 79da1c8:design/30-slices.md` returns their bodies in full, and each issue's agent block
still pins its own criteria.
