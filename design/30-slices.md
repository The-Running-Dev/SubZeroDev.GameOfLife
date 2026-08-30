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

## Outstanding

Twelve slices, all on the content path. Three land the enforcement the contract's `Evidence` column
says nothing yet provides; nine author the content `03` §16.1 asks for. Nothing here touches the
spec-set checker, whose slices are all in `## Landed`.

`03` below is `docs/docs/games/03-game-design.md` throughout.

## S12 — Nothing reaches past the engine's published surface, and nothing reads the published output
Delivers: An author who reaches into the engine's own source tree instead of its published package
          — the easiest mistake this repository offers, because the submodule puts those files a
          short relative path away and the wrong import compiles, runs and passes every gate —
          finds out from a failing test in seconds, instead of finding out months later when the
          campaign turns out to run on nobody else's engine.
Touches: a new test file beside the content suite in `src/`; the `Evidence` cells for CP1, CP2 and
         CP3 in `design/20-contract.md`
Depends on: none
Acceptance:
  - S12.1 A test enumerates every `.ts` and `.mjs` file under `src/` and `scripts/` and asserts each
    import specifier is one of: `@the-running-dev/game-engine`,
    `@the-running-dev/game-engine/authoring`, a Node builtin, a package named in `package.json`'s
    `dependencies` or `devDependencies`, or a relative path that resolves inside `src/` or
    `scripts/`. Any other specifier fails the test, and the failure names the file and the
    specifier.
  - S12.2 The test is verified by breaking it: an import of a path under `engine/` added to a
    campaign source makes it fail, and removing that import makes it pass again. The slice reports
    both runs.
  - S12.3 The same test asserts that `scripts/export-content.ts` is the only file under `src/` or
    `scripts/` containing a filesystem write or delete, and that every write and delete it performs
    resolves under `content/` (CP2).
  - S12.4 The same test asserts that no file under `src/` or `scripts/` reads a file under
    `content/` (CP3).
  - S12.5 `npm test` runs it, so the workflow's *Test the campaign sources* step runs it, and
    `package.json`'s dependency lists are unchanged.
  - S12.6 The `Evidence` cells for CP1, CP2 and CP3 in `design/20-contract.md` name the test file by
    path, in the same commit.
Out of scope: an ESLint configuration or any other new dependency — `90-decisions.md` (2026-08-30,
              published surface) rejected the lint toolchain by name; and any check of the engine's
              own sources, which belong to the engine repository.

## S13 — A failed export cannot leave half a catalog published, and a retired campaign disappears
Delivers: An author whose campaign stops building gets the published directory exactly as it was
          plus the engine's own errors, and an author who renames or retires a campaign finds the
          old file gone rather than sitting in `content/` for a host to keep fetching.
Touches: a test beside the content suite in `src/`; possibly `scripts/export-content.ts`; the
         `Evidence` cells for CP4, CP6 and CP15 in `design/20-contract.md`
Depends on: none
Acceptance:
  - S13.1 A test writes a stray `orphan.json` into `content/`, runs the export, and asserts the file
    is gone and that `git status --porcelain -- content` is empty afterwards (CP6).
  - S13.2 The same test asserts the set of files the export produces is exactly the publication
    catalog's `file` values plus `manifest.json` — no provenance sidecar, no index, no other file
    (CP15).
  - S13.3 A test exercises the exporter against an entry whose build function returns a result that
    is not `ok`, and asserts the run exits non-zero, reproduces the engine's errors rather than
    summarising them, names the entry's file, and leaves every file under `content/` byte-identical
    (CP4).
  - S13.4 The failure S13.3 provokes reports itself as the contract's own reason,
    `CampaignDidNotBuild`, and a rejected validation as `ValidationRejected`, so the error table in
    `design/20-contract.md` § *Content path errors* names what the tree emits.
  - S13.5 The `Evidence` cells for CP4, CP6 and CP15 name the test file by path, in the same commit.
Out of scope: adding `--out-dir` or `--only` to the exporter to make S13.3 easier to stage — the
              contract forbids both by name, and a partial export is indistinguishable from a stale
              one to the clean check. If S13.3 turns out to need an exported seam the contract does
              not carry, the slice stops and asks for a contract amendment rather than adding one.

## S14 — The content gate cannot be relaxed, reordered, or made to pass without running
Delivers: Anyone reading a green content gate — the author locally, a reviewer on a pull request —
          can take it to mean the published JSON was actually regenerated and compared, rather than
          that a step ran in the wrong order, ignored the answer, or reported a pass for a
          comparison it was never able to make.
Touches: `scripts/check-clean.mjs`; a test beside the content suite in `src/`; the `Evidence` cells
         for CP11, CP12 and CP13 in `design/20-contract.md`
Depends on: none
Acceptance:
  - S14.1 A test creates a change outside `content/`, runs `scripts/check-clean.mjs`, and asserts it
    exits 0 — the gate is scoped to `content/`, and an unrelated dirty tree is not its business
    (CP11).
  - S14.2 The same test creates a change under `content/`, runs the check, and asserts a non-zero
    exit whose output names the differing file and reports the reason as `ExportStale`.
  - S14.3 `scripts/check-clean.mjs` reports `GitUnavailable` and exits non-zero — never 0 — when git
    cannot be invoked or the working directory is not a checkout, and a test proves it by running
    the check from a directory that is not a checkout (CP13).
  - S14.4 A test parses `package.json` and asserts the `check` script runs `typecheck` before
    `export:content`, and `export:content` before `check:clean` (CP12).
  - S14.5 The same test parses `.github/workflows/verify.yml` and asserts the `content` job's
    *Typecheck the campaign sources* step precedes the step that re-exports, that the checkout sets
    `submodules: recursive`, and that no step in the job sets `continue-on-error`.
  - S14.6 The `Evidence` cells for CP11, CP12 and CP13 name the test file by path, in the same
    commit.
Out of scope: any `--allow-dirty`, ignore list or whitespace tolerance on the clean check, and any
              change to what the gate compares. The contract forbids each by name.

## S15 — There is work to take, and a way up from it
Delivers: A player can take a job, be paid weekly for it, be judged on how they perform, and be
          promoted along a career that goes somewhere — three careers that each start somewhere
          undignified and end somewhere worse.
Touches: `src/campaigns/stable-life.ts` (`jobs`, `employers`, `skills`), its test file,
         `content/stable-life.json`, `content/manifest.json`
Depends on: S12
Acceptance:
  - S15.1 `stableLifeSource.jobs` has 8 entries, matching `03` §16.1's target, and every entry's
    `tier` is one of the four names `03` §6.1 lists.
  - S15.2 Those 8 jobs carry exactly 3 distinct `careerPathId` values, matching `03` §16.1's three
    career paths, and a test asserts each path's jobs form an ascending tier sequence with a
    `promotionPaths` entry linking each step to the next.
  - S15.3 Every `employerId` a job names exists in `employers`, and every skill any job requirement
    names exists in `skills`, drawn from `03` §3.5's list. A test asserts both by iterating the
    collections rather than by restating the ids.
  - S15.4 Weekly full-time pay matches `03` §16.4's wage table exactly — entry $210, skilled $340,
    professional $520, senior $780 — and part-time pays 55% of the tier's full-time rate for 5 time
    units. The test asserts the cent values.
  - S15.5 Every job cites the `03` section it was transcribed from, in a comment, per CP9.
  - S15.6 Where the pinned engine cannot express something `03` §6 requires, the source omits it
    visibly, names the omission at the site and in the file header per CP10, and the gap is recorded
    under `## Open` in `design/90-decisions.md` so it reaches the engine repository. Nothing is
    approximated.
  - S15.7 `npm run check` passes, and `content/stable-life.json` and `content/manifest.json` are
    regenerated in the same commit with the campaign's digest moved.
Out of scope: events that fire on employment, which are S16; the courses whose credentials a job
              requirement may reference, which are S17; and any balance change to `03` §16.4's
              numbers, which is a design decision rather than a transcription.

## S16 — Weeks stop being identical: work, money and paperwork go wrong on their own
Delivers: A player's week can be interrupted — a shift cancelled, a bill that arrives early, a form
          that needed filing last Tuesday — so the plan they made on Monday is not always the week
          they get.
Touches: `src/campaigns/stable-life.ts` (`events`), its test file, `content/stable-life.json`,
         `content/manifest.json`
Depends on: S15
Acceptance:
  - S16.1 `stableLifeSource.events` has 15 entries, half of `03` §16.1's target of 30, drawn from
    the Employment, Economy, Purchases, Crime, Bureaucracy, Transportation and Business categories
    of `03` §11.1, with every one of those seven represented at least once.
  - S16.2 Every event names its category and its type from `03` §11.1 and §11.2, and a test asserts
    each value is one the corpus lists.
  - S16.3 At least one event is conditional on a job the player holds and at least one on the
    player's cash, expressed through the engine's condition language, and a test asserts both
    conditions evaluate against a built campaign rather than merely being present.
  - S16.4 Every event id a chained event refers to exists, asserted by iterating the collection.
  - S16.5 `03` §11.3's collection quantifiers are not expressible by the pinned engine. Every event
    that would have used one omits that condition visibly and names the omission at the site per
    CP10; the slice reports how many of the 15 were affected, and the gap is recorded under
    `## Open` in `design/90-decisions.md`.
  - S16.6 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: the other 15 events, which are S21; events that require an NPC, which cannot be
              written before S20; and any widening of the engine's condition language, which is the
              engine repository's work and never this repository's to work around.

## S17 — Education is something a player can actually buy, attend, and fail
Delivers: A player can enrol in a course, pay for it, spend their week on it, and come out with a
          credential — or lose the tuition and the weeks by not attending.
Touches: `src/campaigns/stable-life.ts` (`courses`), its test file, `content/stable-life.json`,
         `content/manifest.json`
Depends on: S15
Acceptance:
  - S17.1 `stableLifeSource.courses` has 6 entries, matching `03` §16.1's target, drawn from `03`
    §7.1's education types with no type used twice.
  - S17.2 Tuition, duration and weekly time cost match `03` §16.4's education-cost table exactly,
    asserted as cent and unit values.
  - S17.3 Every course carries the failure rules `03` §7.4 describes — an attendance floor, a study
    floor, and what happens to progress on failure — and a test asserts each is present and within
    the range the corpus states.
  - S17.4 Every credential a job requirement from S15 names is produced by a course here, or that
    requirement is removed in the same commit. A test asserts no job requires a credential no course
    grants.
  - S17.5 Every course cites the `03` section it was transcribed from, per CP9.
  - S17.6 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: the scenario's own "certificate or better" completion requirement, which needs a
              condition over a collection the pinned engine cannot evaluate and belongs to S23; and
              events that fire during study, which are S21.

## S18 — There is somewhere better to live, and a bill for staying there
Delivers: A player can move out of the rented room into something with more room and a larger weekly
          cost, and can see what the week costs before they plan it.
Touches: `src/campaigns/stable-life.ts` (`housing`), its test file, `content/stable-life.json`,
         `content/manifest.json`
Depends on: S12
Acceptance:
  - S18.1 `stableLifeSource.housing` has 4 entries, matching `03` §16.1's target, ordered as an
    ascending progression along `03` §9.2 with the existing rented room as the first.
  - S18.2 Weekly rent for the rented room stays at `03` §16.4's $95, and each higher tier's weekly
    cost is strictly greater than the tier below it, asserted by iterating the collection.
  - S18.3 Every housing entry carries the comfort, safety and damage-facing fields `03` §9.1
    requires, and a test asserts none of them writes `quality`, which `03` §9.1 makes a validation
    error.
  - S18.4 The five recurring weekly costs `03` §16.4 tabulates — rent, utilities, groceries, poor
    groceries, transport — are each either expressed in the source or named as an omission at the
    site per CP10. The slice states which of the five landed where, and records any gap under
    `## Open` in `design/90-decisions.md`.
  - S18.5 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: the grocery items themselves, which are `items` and belong to S19; housing events such
              as damage or a landlord's attention, which are S21; and rebalancing `03` §16.4.

## S19 — A player can spend money on something other than survival
Delivers: A player can buy food, clothes, tools and things that are frankly a mistake, and see each
          purchase change what they can do the following week.
Touches: `src/campaigns/stable-life.ts` (`items`), its test file, `content/stable-life.json`,
         `content/manifest.json`
Depends on: S12
Acceptance:
  - S19.1 `stableLifeSource.items` has 20 entries, matching `03` §16.1's target, covering at least 8
    of `03` §10.1's twelve categories, with every item's category one the corpus lists.
  - S19.2 The two grocery lines `03` §16.4 prices — basic at $45 restoring satiety for a week, poor
    at $25 restoring satiety and costing 3 health — are present with those exact values.
  - S19.3 At least one item carries a durability or maintenance rule per `03` §10.3, and a test
    asserts the fields are within the ranges the corpus states.
  - S19.4 Every item cites the `03` section it was transcribed from, per CP9.
  - S19.5 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: the scenario's starting inventory, which belongs to S23; purchase events, which are
              S21; and any item whose effect the pinned engine cannot express — that is omitted
              visibly and named per CP10, never approximated with a nearer effect.

## S20 — There are other people, and they remember
Delivers: A player deals with named people rather than with systems — a manager, a landlord, a
          friend — and those people carry what happened between them from one week to the next.
Touches: `src/campaigns/stable-life.ts` (`npcs`), its test file, `content/stable-life.json`,
         `content/manifest.json`
Depends on: S15, S18
Acceptance:
  - S20.1 `stableLifeSource.npcs` has 8 entries, matching `03` §16.1's target, covering at least 6
    distinct roles from `03` §12.2.
  - S20.2 Every NPC carries the relationship dimensions `03` §12.1 names, each within the range the
    corpus states, asserted by iterating the collection.
  - S20.3 Every employer an NPC is attached to exists in `employers`, and every housing tier a
    landlord is attached to exists in `housing`; a test asserts both.
  - S20.4 Where `03` §12.3's NPC memories cannot be expressed by the pinned engine, the omission is
    visible and named per CP10, and recorded under `## Open` in `design/90-decisions.md`.
  - S20.5 Every NPC cites the `03` section it was transcribed from, per CP9.
  - S20.6 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: dialogue, which `03` §12.4 places outside the engine's boundary; NPC-triggered events,
              which are S21; and rival simulation under `03` §14.

## S21 — The rest of the week goes wrong too: home, health, people and pure absurdity
Delivers: A player's misfortunes stop being confined to work and money — the boiler, the flu, a
          friend who needs something, and the occasional event that exists only because the corpus
          insists this game is funny.
Touches: `src/campaigns/stable-life.ts` (`events`), its test file, `content/stable-life.json`,
         `content/manifest.json`
Depends on: S16, S18, S19, S20
Acceptance:
  - S21.1 `stableLifeSource.events` reaches 30 entries, matching `03` §16.1's target, with the 15
    added here drawn from the Housing, Health, Relationships, Education, Weather, Opportunity and
    Pure absurdity categories of `03` §11.1 and every one of those seven represented at least once.
  - S21.2 Across all 30, every one of `03` §11.1's fourteen categories is represented at least once,
    asserted by a test that iterates the collection against the corpus's list.
  - S21.3 At least one event is conditional on housing condition, one on an NPC relationship, and
    one on a course in progress, and a test asserts each evaluates against a built campaign.
  - S21.4 Every id an event references — NPC, housing, item, course, chained event — exists,
    asserted by iterating rather than by restating ids.
  - S21.5 Omissions forced by `03` §11.3's collection quantifiers are visible and named per CP10,
    and the slice states the running total across S16 and S21.
  - S21.6 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: widening the engine's condition language; and the `opportunities`, `achievements` and
              `headlines` collections, which `03` §16.1 sets no target for and which stay honestly
              empty until it does.

## S22 — A player does not start from nowhere
Delivers: A player picks who they were before the game started, and that choice changes what they
          begin with and what comes easily to them.
Touches: `src/campaigns/stable-life.ts` (`backgrounds`, `traits`), its test file,
         `content/stable-life.json`, `content/manifest.json`
Depends on: S15, S17, S19
Acceptance:
  - S22.1 `stableLifeSource.backgrounds` has 3 entries, matching `03` §16.1's target.
  - S22.2 Each background differs from the other two in at least one of starting skills, starting
    items, or starting credentials, asserted by comparing the three rather than by restating them.
  - S22.3 Every skill, item and credential a background names exists in the collection that owns it,
    asserted by iterating.
  - S22.4 `traits` carries every trait a background grants, and no trait is defined that no
    background or event uses — asserted in both directions.
  - S22.5 Every background cites the `03` section it was transcribed from, per CP9.
  - S22.6 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: which background the Stable Life scenario starts with, which belongs to S23; and any
              new attribute or skill dimension, which would be a change to `03` rather than a
              transcription of it.

## S23 — The scenario is finishable, and there is more than one thing to aim at
Delivers: A player can win — or fail — Stable Life on its own stated terms, and can choose between
          goals that pull in different directions rather than being handed the only one that exists.
Touches: `src/campaigns/stable-life.ts` (`goals`, `scenarios`), its test file,
         `content/stable-life.json`, `content/manifest.json`
Depends on: S15, S17, S19, S20, S22
Acceptance:
  - S23.1 `stableLifeSource.goals` covers 4 of `03` §13's goal categories, matching `03` §16.1's
    target, with the existing scenario goal among them.
  - S23.2 At least one goal is persistent in the sense of `03` §13.1 — a condition that must hold
    for a stated run of consecutive weeks — and a test asserts the consecutive-week count is present
    and greater than one.
  - S23.3 The Stable Life scenario carries a starting background from S22 and a starting inventory
    drawn from S19's items, and a test asserts every id it names exists.
  - S23.4 `03` §16.3's credential completion requirement — "certificate or better" — is either
    expressed, if S17's credentials made it expressible as a scalar comparison, or still omitted
    visibly with the omission named in the file header per CP10. The slice states which, and if it
    is still omitted, confirms the entry under `## Open` in `design/90-decisions.md` is still open.
  - S23.5 A test asserts every goal's conditions evaluate against a built campaign, and that the
    scenario's `goalIds` all resolve.
  - S23.6 `npm run check` passes, and the export is regenerated in the same commit.
Out of scope: lifting the campaign out of the hidden state its catalog card declares — what makes a
              seed not a seed is `20-contract.md` § *Unresolved* 2, and no slice may decide it; and
              `03` §13.3's alternative game modes, for which §16.1 sets no target.
