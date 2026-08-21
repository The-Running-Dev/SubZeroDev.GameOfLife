# Slices

Derived from [`10-design.md`](10-design.md) and [`20-contract.md`](20-contract.md). The systems
sliced here are the **spec-set checker**, the **marker vocabulary** the corpus carries for it, and
the repository-local migration of the installed **design-state mechanism** — not the game, and not
the engine.

**The riskiest assumption is the restricted grammar.** `90-decisions.md` (2026-08-20, restricted
grammar) bets that PowerShell pattern-matching can extract the corpus's 154 top-level declarations
out of 72 TypeScript fences *and decide closure* without a TypeScript compiler, and it accepts a
Node runtime as the reversal if that bet fails. S1 does nothing else, so the bet is settled in the
first slice against the real 104 KB `04-engine-specification.md` rather than discovered in the
fourth.

The second bet is that a **declared** mirror obligation plus derived closure produces a check worth
reading — `90-decisions.md` (2026-08-20, mirror obligations declared / closure). S3 proves it on
the exact defect the brief names, by removing `wisdom` again and watching the check fail.

Three things a reader should know before working through the set:

- **S3 is the largest slice.** Region extraction, the first check, the report, the boundary
  assertions and two corpus edits. If it does not fit one session without compaction, that is a
  defect in this document — say so rather than pressing on.
- **`tools/Test-CIWorkflow.Tests.ps1` fails on `main` today**, because it reads
  `.github/workflows/verify.yml` and this repository has no `workflows/` directory at all. S2
  creates it. Until then no slice may claim the Pester suite is green.
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

## Contract questions

**Two, and the first blocks S4.** Neither is a slice's to resolve: an invariant and an error
semantic are decisions, so an amendment is `/contract`'s at `opus`/`high`.

### 1. The checker's steady state is exit 2, so CI is red forever

`20-contract.md` § *Error semantics* classifies a reference into SubZeroDev.GameEngine as
`CrossRepositoryUnresolvable` — an **unchecked** entry, with "Caller does: Nothing; this is the
permanent steady state, not a degraded one." **SS5** then says any unchecked entry forces exit 2
regardless of findings, and § `.github/workflows/verify.yml` says "Exit 1 and exit 2 both fail the
step."

The corpus carries 8 such references today (`life-in-the-fast-lane.md` ×3,
`bulgaria-adventure.md` ×5). They are permanently unresolvable by decision —
`90-decisions.md` (2026-08-20, no `-EnginePath`). So from the moment S4 lands, every run of the
checker exits 2, every CI run is red, and **no edit to the corpus can ever make it green.** That
is the outcome the same decision log rejects `-EnginePath`'s finding variant for: "exactly what
trains people to ignore a check."

I think **SS5 is the side that is wrong**, not the CI decision and not SS9. Recommended
resolution: SS5 escalates on an *unexpected* unchecked entry, and `CrossRepositoryUnresolvable`
is named as an expected class that populates the did-not-run list without changing run status —
the pin required by SS17 being the guarantee those references carry, exactly as the decision log
already says. The report still names all 8 every run, so nothing is hidden.

The alternatives, and what each costs: **leave SS5 as it is and drop the CI gate** — honest, and
it returns the check to the voluntary invocation whose enforcement rate the brief is complaining
about; or **leave both and accept a permanently red build** — self-consistent on paper and
worthless in practice.

Until this is settled, S4 must not be implemented. S1–S3 and S5–S7 are unaffected.

### 2. A mirror obligation is all-or-nothing, which pushes `03` toward more duplication

`20-contract.md` § *Error semantics* raises a `mirror` finding when "an obligated closed
declaration has a member absent from its region body". Read literally — and it has to be read
literally, because judging whether prose *describes* a member is the one thing `10-design.md`
establishes cannot be computed — an obligation can only be discharged by prose that names **every**
member of the declaration, by its identifier.

That is satisfiable at exactly two sites in the corpus today, and S3 uses both:
`03` §3.1 lists all five members of `NeedState` and all seven of `AttributeState`. It is *not*
satisfiable at the two next-most-obvious sites: §12.1 names the four relationship dimensions but
`RelationshipState` has ten members, and §13.3's "Classic Mode / Open Life Mode / Challenge Mode"
does not literally contain `classic`, `open_life`, `challenge`.

The tension is that obligating either would require `03` to restate more of `04` than it does now —
the opposite direction from `90-decisions.md` (2026-08-20, reduce the mirrored surface). No
amendment is needed to proceed; the recommendation is to **record it as a stated limit**: the
obligation set covers exact restatements only, and everything else is reduced per Alternative 4 or
left to the full-audit path. Raised because it bounds how much of the brief's second condition this
machinery can ever cover, and that bound is smaller than § *Data model* implies.

## Landed

Nothing yet.

| Slice | Name | Issue | Criteria | Body complete at |
|---|---|---|---|---|

## Outstanding

## S1 — The spec set is read end to end, or the run stops and points at the line
Delivers: Anyone editing the game specifications can run one command and know the whole set was
          actually read — how many documents it found, how many type definitions, and which of
          those have a fixed list of parts. If it meets something it does not understand it stops
          and names the file and the line, rather than skipping it quietly and reporting that
          everything is fine.
Touches: `tools/Read-SpecSet.ps1`, `tools/Read-SpecSet.Tests.ps1`, `tools/Test-SpecSet.ps1`,
         `tools/Test-SpecSet.Tests.ps1`, `design/20-contract.md` (the *Derived records* and
         `Read-SpecSetIndex` scaffold blocks)
Depends on: none
Acceptance:
  - S1.1 `./tools/Test-SpecSet.ps1` run from the repository root exits 0 and emits a
    `[pscustomobject]` whose `State` is `Valid`, reporting 8 documents for `docs/docs/games/` and a
    non-zero declaration count.
  - S1.2 The run over the real corpus produces no `UnknownDeclarationForm`: all 72 `typescript`
    fences (71 in `04-engine-specification.md`, 1 in `05-text-client.md`) are consumed, including
    the 4 `interface X extends Y` forms, the 1 generic declaration, the 26 method-signature lines
    and the 31 `Record<...>` types.
  - S1.3 A fixture corpus holding one construct outside the grammar yields `State =
    'NotEvaluated'`, `Reason = 'UnknownDeclarationForm'`, exit 2, naming the fixture path and the
    1-based line — and reports no declarations at all from that run.
  - S1.4 `AttributeState` extracts with `IsClosed` true and `Members` holding all seven names
    including `wisdom`; `GameMode` extracts with `IsClosed` true and `Members` `classic`,
    `open_life`, `challenge`; `PlayerState.skills` extracts with `IsClosed` false and an empty
    `Members`.
  - S1.5 `UnreadableDocument` and `CorpusNotFound` each yield `State = 'NotEvaluated'` with that
    `Reason` and exit 2, proven by fixtures. `Get-SpecSetExitCode` throws on a state it does not
    recognise rather than returning a default.
  - S1.6 The report names the commit the run was made against and whether the working tree was
    clean. Run outside a git repository it reports `NotAGitRepository`.
  - S1.7 A Pester test parses both scripts with
    `[System.Management.Automation.Language.Parser]` and fails if `-match`, `-replace`, `-split`,
    `Select-String` or `[regex]` occurs anywhere outside `tools/Read-SpecSet.ps1`.
  - S1.8 A Pester test fails if either script declares a `-Fix`, `-Write`, `-Apply` or
    `-EnginePath` parameter, or passes a path under `docs/docs/games/` to a write cmdlet.
  - S1.9 `-Quiet` suppresses the human-readable report and nothing else: a test asserts the result
    object is still emitted under `-Quiet`.
  - S1.10 The `design/20-contract.md` scaffold blocks for the five record classes and for
    `Read-SpecSetIndex` are replaced by a pointer to `tools/Read-SpecSet.ps1`, in the same commit,
    leaving the surrounding semantics intact.
Out of scope: every check. This slice reports what the index found and says nothing about whether
              the corpus is right. No marked-region extraction, no reference extraction, no CI
              workflow — S2, S3 and S4 own those. Do not add a parameter that reaches outside
              `-CorpusPath`.

## S2 — Every push runs the checks
Delivers: Nobody has to remember to run the spec-set check. Every push and every pull request runs
          it alongside the repository's own tool tests, and a red build is the signal that
          something in the specifications needs looking at. The repository has no automated checks
          at all today.
Touches: `.github/workflows/verify.yml`
Depends on: S1
Acceptance:
  - S2.1 `.github/workflows/verify.yml` exists, runs on push and on pull request, and installs
    nothing beyond PowerShell 7 and Pester.
  - S2.2 It carries five steps, each with `# verification: true` on the line immediately above its
    `- name:`: `Parse-check PowerShell scripts`, `Run Pester tests`, `Validate the core/companion
    split`, `Check the design state against the tree`, and `Check the spec set` — the last running
    `./tools/Test-SpecSet.ps1`.
  - S2.3 The `Run Pester tests` step carries `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`, so
    `tools/Test-CIWorkflow.Tests.ps1` — which fails on `main` today — passes.
  - S2.4 Exit 1 and exit 2 from `Check the spec set` both fail the step; a workflow-parsing test
    asserts the step does not swallow either with `continue-on-error` or `|| true`.
  - S2.5 `Invoke-Pester -Path tools` reports zero failures on the branch.
Out of scope: anything the workflow does beyond gating — no docs build (it needs Docker and no
              brief condition depends on the site rendering), no deploy, no publish, no release.
              Do not flag a step that only prepares the runner. Do not edit
              `.claude/commands/verify.md`'s table of flagged steps; S2 is what makes it true.

## S3 — The two documents stop being able to disagree about the types they both describe
Delivers: When the game design document lists what the player tracks and the engine specification
          defines the same thing, a mismatch between them is caught by a command instead of by
          someone happening to read both in one sitting. Adding a field in one place and
          forgetting the other is a defect this project has already shipped.
Touches: `tools/Read-SpecSet.ps1` (marked-region extraction), `tools/Test-SpecSet.ps1`
         (`Invoke-SpecSetCheck`, the mirror check, `Write-SpecSetReport`), both test files,
         `docs/docs/games/03-game-design.md` §3.1, `design/20-contract.md` (the
         `tools/Test-SpecSet.ps1` scaffold block)
Depends on: S1, S2
Acceptance:
  - S3.1 `03-game-design.md` §3.1 carries a `mirror-NeedState` region around the sentence listing
    the needs and a `mirror-AttributeState` region around the sentence listing the attributes.
    Both are held against `04-engine-specification.md` as it stands, and the run exits 0.
  - S3.2 Deleting `wisdom` from §3.1's attribute sentence, with `04` unchanged, produces exactly
    one `mirror` finding naming `AttributeState.wisdom` and exits 1; restoring it returns exit 0.
    The test asserts both directions.
  - S3.3 A finding's `Detail` names the member and both document paths and states only that they
    disagree; a test asserts `SpecFinding` declares no field able to record which side is stale.
  - S3.4 A `mirror-PlayerState.skills` region — an open declaration — produces a `mirror` finding
    rather than being ignored, and so does a region naming a declaration that does not exist.
  - S3.5 `03` §3.5's twelve skills produce no finding of any kind.
  - S3.6 A region whose markers are unclosed, mismatched or nested yields `MalformedRegion` and
    exit 2; two regions sharing an id yield `DuplicateRegionId` and exit 2; a document with no
    regions is valid input yielding zero obligations and exit 0.
  - S3.7 A Pester test asserts no check function calls a file cmdlet, and that the check call
    graph is flat — no check invokes another.
  - S3.8 The report states the number of obligations checked and never says that
    `03-game-design.md` and `04-engine-specification.md` are consistent; a test asserts the
    wording in `Write-SpecSetReport`.
  - S3.9 Both markers added to `03` are HTML comments carrying nothing outside the comment
    delimiters, and `./docs.ps1 -BuildOnly` succeeds with §3.1 still rendering as one list. This
    step needs Docker; if Docker cannot run, the criterion is not met and must be reported as not
    met rather than assumed.
  - S3.10 The `design/20-contract.md` scaffold block for `tools/Test-SpecSet.ps1` is replaced by a
    pointer to that file, in the same commit.
Out of scope: obligating anything beyond the two sites named above. §12.1 and §13.3 cannot
              discharge an obligation as the contract defines one — see *Contract questions* 2 —
              and finding more obligation sites is a reading of `03`, which `10-design.md` assigns
              to the full-audit path, not to this machinery. Do not delete prose from `03` under
              Alternative 4's reduction; that is a reviewed pass with its own scope decision, not a
              side effect of wiring a check.

## S4 — Every reference resolves, and every claim about the engine repository pins a commit
Delivers: Cross-references in the specification set stop being taken on trust. A section number or
          a link that points at nothing gets named with the document and line it sits on, and a
          claim about the separate engine repository has to say which commit of that repository it
          was true at — because nothing here can check it, and an unpinned claim about another
          repository cannot be shown to be wrong at all.
Touches: `tools/Read-SpecSet.ps1` (reference extraction), `tools/Test-SpecSet.ps1` (the reference
         check, the unchecked list, status precedence), both test files,
         `docs/docs/games/life-in-the-fast-lane.md`, `docs/docs/games/bulgaria-adventure.md`
Depends on: S1, S2, S3, and *Contract questions* 1 — do not start until SS5 is settled
Acceptance:
  - S4.1 All 107 `§N.N` section references and all 36 document links in the corpus extract with
    `SourcePath`, `Line`, `Kind` and `RawTarget`, and the run reports those counts.
  - S4.2 A section reference whose target heading does not exist, and a document link whose target
    file does not exist, each produce exactly one `reference` finding naming the source document
    and line; proven by a fixture and by breaking and restoring one real reference.
  - S4.3 The 8 references to `engine/*.md` are classified `CrossRepository` with `Resolution`
    `NotEvaluable` and appear in the run's unchecked list, never in the findings list as passed and
    never as broken.
  - S4.4 Each of those 8 carries a pinned sha in the `<path> § <section> @ <sha>` form, read from
    `SubZeroDev.GameEngine`'s own history; a cross-repository reference with no pin is a
    `reference` finding.
  - S4.5 A fixture run in which one check records an unchecked entry and another produces a
    finding resolves its exit code as SS5 requires once *Contract questions* 1 is settled, and the
    test asserts that behaviour explicitly rather than inheriting it.
  - S4.6 Held, failed and unchecked counts sum to the index totals for obligations, register rows,
    concepts and references; a test asserts the sum.
Out of scope: reading SubZeroDev.GameEngine at check time — there is no `-EnginePath` and adding
              one is a contract amendment. Correcting the `engine/…` paths themselves: they do not
              match that repository's actual `design/…` layout, but detecting that needs a second
              checkout this checker is forbidden to have, so it is a full-audit finding and belongs
              in the tracker, not here.

## S5 — Every provisional number says why it is deferred and what would settle it
Delivers: A number that was invented so the simulation had something to run can no longer be
          mistaken for a decided one. Each is marked where it appears, listed in exactly one place,
          and has to say both why it is still open and what would close it.
Touches: `docs/docs/games/04-engine-specification.md` §22.2 and the sites it names,
         `docs/docs/games/03-game-design.md` §3.3 and §16.4, `tools/Test-SpecSet.ps1` (the
         provisional check), both test files, `AGENTS.md`, `agent.md`
Depends on: S1, S2, S3
Acceptance:
  - S5.1 `04` §22.2's table carries the columns `Area`, `Call made`, `Reason`, `Settles when`, and
    all six rows have a non-empty `Reason` and a non-empty `Settles when`.
  - S5.2 Emptying either cell of any row produces exactly one `provisional` finding naming that
    row and exits 1.
  - S5.3 Exactly one `provisional-register` region exists across the whole corpus; a fixture
    carrying two yields `DuplicateRegionId` and exit 2.
  - S5.4 Each of the six rows has a matching `provisional-site-` region at the number itself — two
    exist in `03` today, four do not — and a row with no site, or a site with no row, produces
    exactly one `provisional` finding each.
  - S5.5 A corpus with no `provisional-register` region records `RegisterAbsent` as unchecked and
    never exits 0.
  - S5.6 The lists of provisional numbers in `AGENTS.md` and `agent.md` are replaced by a pointer
    to `04` §22.2, so the register is the only enumeration in the repository.
Out of scope: deciding any of the six numbers. **Do not invent the `§8.7 Housing quality` row's
              settling condition** — its reason is "Pure balance; expect it to change", it has no
              condition to migrate, and `90-decisions.md` (2026-08-20, sole provisional register)
              forbids inventing one. Ask, and stop until answered. Do not reconcile the three
              disagreeing lists item by item beyond replacing two of them with pointers.

## S6 — Everything the game keeps in state is counted, and told what it must say
Delivers: For everything the game holds in a save — an opportunity, a scheduled event, a status
          effect, a goal — the specification has to say what brings it into existence and what
          removes it. Two already do. This puts a number on how many do not, before anyone starts
          closing the gap.
Touches: `tools/Read-SpecSet.ps1` (concept derivation), `tools/Test-SpecSet.ps1` (the concept
         check), both test files, `docs/docs/games/04-engine-specification.md` §5.4.1 and §5.4.2
Depends on: S1, S2, S3
Acceptance:
  - S6.1 The concept set is derived from `GameState`'s 17 fields and the declarations reachable
    from them. A test asserts `Opportunity`, `ScheduledEvent`, `StatusEffect`, `GoalState` and
    `PlayerState` are members, and that `ResolutionDebugInfo` — which never enters game state — is
    not.
  - S6.2 `04` §5.4.1 and §5.4.2 are wrapped as `lifecycle-Opportunity` and
    `lifecycle-ScheduledEvent`, and both are held.
  - S6.3 Every derived concept with no `lifecycle-` region produces exactly one `concept` finding
    naming it; the run exits 1 and the report lists every one of them by name.
  - S6.4 Deleting the `**Resolution.**` half of §5.4.1 produces a `concept` finding for a
    lifecycle that states creation but not retirement; restoring it clears the finding.
  - S6.5 A `lifecycle-` region naming something outside the derived concept set is a `concept`
    finding rather than a silently ignored region.
Out of scope: writing the missing lifecycles — that is S7, and the split is deliberate. Stateless
              mechanisms — the eviction ladder, promotion, the check formula — are outside the
              concept set by decision and get no region here.

## S7 — The missing lifecycles are written
Delivers: Every remaining thing the game keeps in state gets its lifecycle written down, so the
          engine repository can implement it without having to ask who creates it and what removes
          it. This is the last of the brief's four completion conditions to be met, and the gate
          goes green when it is.
Touches: `docs/docs/games/04-engine-specification.md`, and `docs/docs/games/03-game-design.md`
         where a concept is introduced there
Depends on: S6
Acceptance:
  - S7.1 Every concept in the derived set carries a `lifecycle-` region;
    `./tools/Test-SpecSet.ps1` reports zero `concept` findings.
  - S7.2 Every region added states both what creates the concept and what retires it, in the form
    `04` §5.4.1 already uses — a creation paragraph naming each path, and a retirement paragraph
    naming each exit.
  - S7.3 Deleting any one of the regions added by this slice produces exactly one `concept`
    finding naming that concept, and restoring it clears it.
Out of scope: changing what any concept *does*. A lifecycle that cannot be written without
              deciding a mechanic is a design question — name it, stop, and leave the finding
              standing rather than inventing the mechanic to clear a check.

### Restored installed design-state path

`20-contract.md` now carries the installed design-state path that the spec-set contract had
displaced. The reader, checker, projector, mirror writer, command surfaces and tests are already in
the tree; the missing vertical is this repository's persisted state. S8–S11 migrate only artifacts
and decisions that exist here. They do not copy AgentKit's own state, and they preserve the existing
`WorkRef` records byte-for-byte until `/track` next refreshes them.

S8–S10 deliberately leave the design-state gate non-zero while the migration is incomplete. Each
names the remaining classes explicitly so a partial record set cannot be mistaken for a clean one.
S11 is the first slice allowed to create the projected index and regenerate all regions, because a
projector run against only part of the invariant set would overwrite the contract's complete table
with a partial one.

## S8 — Every command can be read as one connected record
Delivers: Anyone changing a repository command can open one record and see what that command owns,
          which checked surfaces it uses or offers, and which standing rules and decisions govern
          it. A command that is present but unrecorded, or a relationship that points nowhere, is
          named by the checker.
Touches: `design/state/units/command/`, the contract, invariant, decision and owner-unit records
         directly referenced by those command records, `tools/Test-DesignState.Tests.ps1`
Depends on: none
Acceptance:
  - S8.1 The files matched by the `command` row of `design/20-contract.md` § *Artifacts of a unit
    kind* and the active command-unit records have an empty set difference in both directions;
    `UnrecordedArtifact` reports none for that kind.
  - S8.2 Every command record's `Anchor` resolves, every id it names resolves, and every list-valued
    field is present even when empty. `AnchorMissing`, `UnresolvedId` and `RecordUnparseable` report
    none for the records this slice writes.
  - S8.3 Every installed public surface a command consumes or exposes has a contract record. Each
    contract's `Owner` is the unique active unit that exposes it and its `Declaration` is `prose` or
    resolves to a tree path; `OwnerMismatch` and `AnchorMissing` report none for those contracts.
  - S8.4 A Pester assertion checks the command-to-contract relations the existing contract and
    command files state explicitly: `unit/command/resolve` consumes
    `contract/wait-pullrequestcheck`, and `unit/command/track` consumes both
    `contract/test-designdrift` and `contract/update-workmirror`.
  - S8.5 Every invariant or decision id named by a command record has a corresponding local record;
    no record is copied merely because it exists in the AgentKit source repository.
  - S8.6 The existing files under `design/state/work/` are byte-identical before and after the
    migration, and no command in this slice invokes `Update-WorkMirror.ps1`.
  - S8.7 The design-state report names the remaining unrecorded script, document, invariant or
    decision work and `ProjectorFailed`; it does not exit 0 while those categories remain. It names
    the largest completed closure, and none exceeds 16,384 bytes.
Out of scope: completing the script and document unit sets; completing the invariant or decision
              sets beyond ids the command closures need; creating `design/state-index.md` or
              regenerating any projection; changing a command, public surface or decision to make
              its record easier to write.

## S9 — Every checked script and standing document can be read as one connected record
Delivers: Anyone changing a repository tool or governing document gets the same addressable view as
          a command: what it owns, what it relies on, which rules bind it, and where its executable
          evidence lives. Adding a checked artifact without adding its record becomes a named
          divergence.
Touches: `design/state/units/script/`, `design/state/units/document/`,
         `design/state/contracts/`, the invariant and decision records directly referenced by those
         units, `tools/Test-DesignState.Tests.ps1`
Depends on: S8
Acceptance:
  - S9.1 The files matched by the `script` and `document` rows of `design/20-contract.md`
    § *Artifacts of a unit kind* and their active unit records have an empty set difference in both
    directions; `UnrecordedArtifact` reports none for command, script or document kinds.
  - S9.2 The exclusions remain exclusions and have no unit record: `*.Tests.ps1`, `*-local.md`,
    `design/FROZEN.md` and `CLAUDE.md`.
  - S9.3 A script with a Pester test names that existing test in `Evidence`; every unit `Anchor`,
    contract `Declaration` and evidence pointer resolves. `AnchorMissing` reports none.
  - S9.4 Every installed public-surface entry in `design/20-contract.md` has exactly one contract
    record and one unique active owner, with no extra contract record. `OwnerMismatch` reports none.
  - S9.5 Every id named by the records this slice writes resolves, every list-valued field is
    present, and no derived `Consumers`, `BoundBy` or `Affects` field is authored.
    `UnresolvedId` and `RecordUnparseable` report none.
  - S9.6 The design-state report still names any remaining invariant rows, decision headings and
    `ProjectorFailed`; it does not exit 0 while those categories remain. It names the largest
    completed closure, and none exceeds 16,384 bytes.
Out of scope: completing invariant and decision records beyond ids the unit closures need; creating
              or regenerating projected regions; adding a tree artifact to give a record an anchor;
              changing the public surface or its semantics.

## S10 — Every local rule and logged decision becomes addressable
Delivers: Every rule the repository binds itself to and every decision it has logged becomes a file
          that can be followed from its owner. Superseded decisions lead to their replacement, and
          a rule claiming code enforcement points at evidence that exists.
Touches: `design/state/invariants/`, `design/state/decisions/`, `design/state/questions/`,
         `design/state/units/`, `tools/Test-DesignState.Tests.ps1`
Depends on: S8, S9
Acceptance:
  - S10.1 The `I<n>` rows inside `design/20-contract.md` § *Invariants* and the invariant records
    have an empty set difference in both directions; `UnrecordedArtifact` reports none for the
    invariant kind.
  - S10.2 Every invariant record reproduces its contract row's statement, owner and enforcement
    without changing their meaning. A record enforced by code names existing evidence, its owner
    binds it, and `EnforcementUnevidenced`, `AnchorMissing` and `UnresolvedId` report none.
  - S10.3 Every decision heading in `design/90-decisions.md` has exactly one decision record whose
    `Anchor` resolves to that heading, and no decision record names a heading that does not exist.
    `LogEntryUnrecorded` and `DecisionAnchorAmbiguous` report none.
  - S10.4 The 2026-08-20 marker-vocabulary decision is `superseded` and names the 2026-08-21
    document-scoped identity decision in `SupersededBy`; accepted decisions carry no such field.
    Removing that line makes `EnforcementUnevidenced` fire for the local record, and restoring it
    clears the finding.
  - S10.5 Decision records carry the standing claim and never copy the `Rejected:` alternatives.
    Unit `Live` and `Archival` ids resolve and no id appears in both lists on one unit.
  - S10.6 No question record is invented from a heading, template instruction or absent source.
    An answered question would require `AnsweredBy`, but the migration creates one only for a
    question that already exists as local contract state.
  - S10.7 The repository-coupled Pester case for a superseded decision uses the local pair in
    S10.4, not an AgentKit decision file that this repository does not own.
  - S10.8 Existing `WorkRef` records remain byte-identical, `design/90-decisions.md` has no deletion,
    reordering or reformatting, and the largest closure is named with its size and largest
    contributor. None exceeds 16,384 bytes.
Out of scope: changing an invariant's statement, owner or enforcement; changing, adding or
              relitigating a logged decision; importing AgentKit decisions; answering a question;
              creating or regenerating projected regions.

## S11 — The local design state reaches a checked fixed point
Delivers: A developer can open one local index to navigate the repository's units, contracts,
          rules and decisions, and can run the installed check knowing every projected view matches
          those records. A missing tracker comparison is still reported honestly, but the local
          state itself is complete and clean.
Touches: `design/state-index.md`, `design/20-contract.md` (§ *Invariants*), the records completed by
         S8–S10, `tools/Test-DesignState.Tests.ps1`
Depends on: S8, S9, S10
Acceptance:
  - S11.1 `design/state-index.md` exists with exactly one projected region for each of `units`,
    `bound-by`, `consumers`, `decision-affects`, `question-affects` and `outstanding`; the document
    carries no hand-authored copy of any rendered row.
  - S11.2 `design/20-contract.md`'s `invariants` region renders every invariant record and no
    hand-authored tail. Regeneration changes no invariant statement, owner, enforcement or evidence
    value and loses no surrounding prose.
  - S11.3 `Update-DesignProjection.ps1 -DryRun` returns every contracted projection with no refusal
    and writes nothing. A normal run followed by a second normal run is byte-identical, and
    `ProjectionStale` reports none.
  - S11.4 `UnrecordedArtifact`, `AnchorMissing`, `OwnerMismatch`, `UnresolvedId`,
    `DecisionAnchorAmbiguous`, `LogEntryUnrecorded`, `EnforcementUnevidenced`,
    `ClosureOverBudget`, `ClassListDisagreement`, `GlobDisagreement`, `RegionMalformed`,
    `IdCollision` and `ProjectionStale` report no blocking finding against the real tree.
  - S11.5 With authenticated tracker access, `./tools/Test-DesignState.ps1` exits 0 and names the
    largest closure, its size and its largest contributor. Without tracker access it exits 2 with
    `TrackerUnavailable` and the local blocking-finding list remains empty; neither case is
    reported as the other.
  - S11.6 `Invoke-Pester -Path tools` reports zero failures. In the regression that removes and
    restores the local `SupersededBy` line, the checker exits 1 and then 0 respectively, and the
    test leaves the tree byte-identical to how it found it even if an assertion fails.
  - S11.7 The existing `WorkRef` files remain mirrors rather than authority: this slice neither
    rewrites them nor invokes `/track`, and the `outstanding` projection renders only what those
    records already carry, including `MirroredAt` and `Rank`.
Out of scope: refreshing or adjudicating tracker state; changing any installed script or command
              public interface; changing the closed divergence-class list; modifying an invariant
              or decision merely to make the gate green; importing state from AgentKit.
