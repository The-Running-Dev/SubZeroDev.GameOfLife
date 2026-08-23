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

Bodies retired per *How this document is kept*. `git show 394505a:design/30-slices.md` returns all
four in full, and each issue's agent block still pins its own criteria.

| Slice | Name | Issue | Criteria | Body complete at |
|---|---|---|---|---|
| S1 | The spec set is read end to end, or the run stops and points at the line | #8 | S1.1–S1.10 | `394505a` |
| S2 | Every push runs the checks | #9 | S2.1–S2.5 | `394505a` |
| S3 | The two documents stop being able to disagree about the types they both describe | #10 | S3.1–S3.10 | `394505a` |
| S5 | Every provisional number says why it is deferred and what would settle it | #12 | S5.1–S5.6 | `394505a` |

## Outstanding

## S4 — Every reference resolves, and every claim about the engine repository pins a commit
Delivers: Cross-references in the specification set stop being taken on trust. A section number or
          a link that points at nothing gets named with the document and line it sits on, and a
          claim about the separate engine repository has to say which commit of that repository it
          was true at — because nothing here can check it, and an unpinned claim about another
          repository cannot be shown to be wrong at all.
Touches: `tools/Read-SpecSet.ps1` (reference extraction), `tools/Test-SpecSet.ps1` (the reference
         check, the unresolvable list, status precedence, the report's unresolvable count), both
         test files, `docs/docs/games/life-in-the-fast-lane.md`,
         `docs/docs/games/bulgaria-adventure.md`, `design/20-contract.md` (the `Unresolvable`
         scaffold sentence)
Depends on: S1, S2, S3
Acceptance:
  - S4.1 All 107 `§N.N` section references and all 36 document links in the corpus extract with
    `SourcePath`, `Line`, `Kind` and `RawTarget`, and the run reports those counts.
  - S4.2 A section reference whose target heading does not exist, and a document link whose target
    file does not exist, each produce exactly one `reference` finding naming the source document
    and line; proven by a fixture and by breaking and restoring one real reference.
  - S4.3 The 8 references to `engine/*.md` are classified `CrossRepository` and appear in the
    run's **unresolvable** list — never in the unchecked list, never in the findings list as
    passed, and never as broken (SS9). A run whose only unresolvable entries are those 8, and
    which produces no finding, exits 0.
  - S4.4 Each of those 8 carries a pinned sha in the `<path> § <section> @ <sha>` form, read from
    `SubZeroDev.GameEngine`'s own history; a cross-repository reference with no pin is a
    `reference` finding.
  - S4.5 Three fixtures assert SS5 in both directions explicitly rather than inheriting it: one
    unchecked entry plus one finding exits 2; one unresolvable entry plus one finding exits 1; one
    unresolvable entry and no finding exits 0.
  - S4.6 Held, failed, unchecked and unresolvable counts sum to the index totals for obligations,
    register rows, concepts and references (SS6); a test asserts the sum over all four buckets.
  - S4.7 A run reporting `State = 'Valid'` with a non-zero unresolvable count names that count in
    the human-readable report (SS18); a fixture asserts the count appears under `Valid`, and a test
    asserts no report wording states or implies that an unresolvable subject was checked.
  - S4.8 The `Unresolvable` scaffold sentence in `design/20-contract.md`
    § `tools/Test-SpecSet.ps1` is deleted in the same commit that lands the field, leaving the
    surrounding meaning intact: it is a separate list from `Unchecked`, never merges into it, and a
    consumer reading only `State` cannot recover it.
Out of scope: reading SubZeroDev.GameEngine at check time — there is no `-EnginePath` and adding
              one is a contract amendment. Adding a second member to the unresolvable list: it is
              closed at `CrossRepositoryUnresolvable`, admission requires a *recorded decision*
              rather than a check that turned out to be hard, and that bar is the only thing
              bounding the category. A check that cannot complete records an *unchecked* entry. Correcting the `engine/…` paths themselves: they do not
              match that repository's actual `design/…` layout, but detecting that needs a second
              checkout this checker is forbidden to have, so it is a full-audit finding and belongs
              in the tracker, not here.

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
