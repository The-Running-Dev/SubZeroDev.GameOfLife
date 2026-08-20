# Contract — Life in the Fast Lane (spec set)

Derived from [`10-design.md`](10-design.md). Binding on every slice.

The system contracted here is the **spec-set checker** and the **marker vocabulary** the corpus
carries for it. The corpus's own meaning — the game, the engine, the numbers — is not this
document's subject and is never constrained by it.

Invariant ids in this document are prefixed `SS`. They are a separate namespace from the `I<n>`
ids that `AGENTS.md` and `.claude/commands/*.md` cite, which belong to the agent kit's own
contract and are not referenced here.

**Scaffold notice.** Declarations below marked *scaffold* exist here only until the slice that
materialises them lands. That slice replaces the block with a pointer to the declaring file in the
same commit, and what remains is the surrounding semantics. Nothing in this document may be read
as authorising a second copy of a declaration the tree carries.

## Types

Nine record types. Five derived, four authored. The split is the load-bearing distinction and is
not an implementation detail: a derived record cannot drift from the corpus, and an authored one
can, which is why only the authored ones are checked for well-formedness.

### Derived records

Recomputed on every run from the markdown and discarded when the run ends. They have no
persisted form, no identity across runs, and no serialisation. Nothing may write them anywhere.

The five derived record classes are declared in [`tools/Read-SpecSet.ps1`](../tools/Read-SpecSet.ps1).

**Closure** is a derived property of `SpecDeclaration`, not a record of its own and not a field
anyone may author. A declaration is **closed** when its membership is fixed by its own form — an
interface with named fields, a string-literal union, an enum. It is **open** when membership is
supplied by content at load time — a keyed map or record whose value type is a content definition.

The distinction is the difference between a defect and a false positive, and it is why this system
can be run at all. `AttributeState` is closed, so prose that lists six of its seven fields is the
defect the brief names. Skills are open — `04` names no skill — so the twelve skills listed in
`03` §3.5 are content targets and their divergence from anything in `04` is not drift. A checker
without the distinction reports §3.5 on every run, and a register of false positives is not read.

**No marker, parameter, environment variable, or configuration file may set or override closure**
(SS8). A hand-maintained closed/open flag is the second copy this whole design exists to avoid.

**`SpecFinding.Detail` never attributes fault.** A mirror finding establishes that `03` and `04`
disagree. Which of them is stale is the user's call, and a checker that guessed would be making a
design decision by exit code.

### Authored records

Declared marked regions in the sense `AGENTS.md` § *Marked regions* already defines — hand-authored,
never generated, checked for presence and well-formedness like any other region. **No new marker
syntax is introduced and no sidecar file is created.** The vocabulary below is the whole addition.

Each region uses the declared form `<!-- <id>:declared:start -->` … `<!-- <id>:declared:end -->`.
Ids are unique across the corpus — one namespace, shared with any projected region that may later
exist, per the collision rule `AGENTS.md` already states.

| Record | Region id | Lives in | Body |
|---|---|---|---|
| Mirror obligation | `mirror-<QualifiedName>` | `03` | The prose that describes the declaration |
| Provisional entry | `provisional-register` | `04` §22.2 | The register table; exactly one such region exists corpus-wide |
| Provisional site | `provisional-site-<Key>` | Wherever the number is written | The sentence or row carrying the number |
| Concept lifecycle | `lifecycle-<ConceptName>` | The document introducing the concept | Prose stating what creates it and what retires it |

**Region bodies are visible prose, not hidden data.** Only the two markers are HTML comments.
This is what makes the dependency run one way: delete the checker and every region body is still
the sentence a reader was going to read, the corpus still builds, and nothing is orphaned. A
region whose body carries information a reader has no use for is a sidecar wearing a marker, and
is a defect in the authoring, not a feature of the format.

**A mirror obligation may name only a closed declaration** (SS15). Naming an open one is a finding,
not a silently ignored region — an author who obligates a keyed map has misunderstood the
distinction and needs telling.

**A concept is a state-bearing entity** — something `04` holds in game state. Stateless mechanisms
(the eviction ladder, promotion, the check formula) are outside the derived concept set and are
judged on the full-audit path. This bounds the fourth brief condition to something enumerable from
the index; the broad reading is not enumerable mechanically at all, and a check that cannot know
what is missing does not check completeness.

## Persisted schemas

**The checker persists nothing.** No database, no cache, no sidecar, no report file, no state
directory. Every derived record is recomputed per run and discarded. A run that fails leaves the
corpus byte-identical to how it found it.

**Migration story: none, and it is a constraint rather than an absence.** There is no persisted
artifact to migrate because persisting one would create the second copy of `04`'s declarations
that `90-decisions.md` (2026-08-20, sidecar) rejected. A future slice that introduces a cache is
amending this contract, not optimising within it.

The corpus itself is the only persisted state, and the checker's schema over it is the marker
vocabulary above plus one table shape.

**Adding markers is additive.** The corpus today carries none, so there is nothing to migrate, and
a document with no regions is valid input yielding zero obligations rather than an error.

### The provisional register's table shape

`04` §22.2 today has three columns — `Area`, `Call made`, `Why it may need revisiting` — and the
last folds the reason and the settling condition into one free-text cell. **SS13 requires them
split**, into `Area`, `Call made`, `Reason`, `Settles when`. This is not cosmetic: with one column
the check has to decide whether a sentence contains a settling condition, which is judgement over
prose and exactly what `10-design.md` establishes cannot be computed. With two, the check is "the
cell is non-empty" — set arithmetic, which is the only kind of check this system is allowed to make.

**Migration: the six existing rows gain a column, and one of them fails on the first run.** The
`§8.7 Housing quality` row's reason is "Pure balance; expect it to change", which has no settling
condition to move into the new cell. That row is a day-one `provisional` finding and is meant to be
— it is the brief's third condition catching the first thing it was written to catch. Whoever lands
this either writes a real condition or records why the number is deferred indefinitely. **Do not
migrate it by inventing one.**

`.claude/gates.json` and `.claude/verify-report.json` are written by `/verify` and
`tools/Test-GatesCache.ps1`, not by anything in this contract. The checker returns a result object
and an exit code; what consumes them is not its concern.

## Public surface

### `tools/Read-SpecSet.ps1` — Corpus access and Index

`Read-SpecSetIndex` is declared in [`tools/Read-SpecSet.ps1`](../tools/Read-SpecSet.ps1).

Returns an index object carrying `SpecDocument[]`, `SpecDeclaration[]`, `SpecReference[]`, the four
authored record collections, and a `State` of `Indexed` or `NotEvaluated` with a `Reason`.

**This file contains every regular expression in the system** (SS2). No other file may match text.
The containment is the point: extraction is the fragile part, and a fragile part smeared across
four checks has four failure modes instead of one.

`-CorpusPath` must not acquire a default that resolves outside the repository. Defaulting it to
`docs/docs/games/` relative to the script's own repo root is intended; defaulting it to a caller's
working directory is not, because a run against the wrong tree reports a clean corpus that was
never examined.

**No parameter may make a cross-repository reference resolvable** (SS9). There is no
`-EnginePath`, and adding one is a contract amendment rather than a slice's call. A checker whose
answer depends on whether a second working copy happens to be checked out beside this one gives two
authors different results on the same commit, and `SpecReference.PinnedSha` is the guarantee
carried instead.

### `tools/Test-SpecSet.ps1` — Checks, Report, Runner

The runner and its check/report functions are declared in
[`tools/Test-SpecSet.ps1`](../tools/Test-SpecSet.ps1).

The entry point emits a result object and then exits, guarded by
`if ($MyInvocation.InvocationName -ne '.')` so the Pester file can dot-source it — the structure
`Test-Companion.ps1` and `Test-WriteSurface.ps1` already use, for the same reason.

The result object is a `[pscustomobject]` and not one of the classes above, because `/verify`
already consumes that shape from `Test-Companion.ps1` and `Test-DesignState.ps1`. Its `State` is
`Valid`, `Invalid`, or `NotEvaluated`; it carries `Findings`, `Unchecked`, per-check counts, the
commit it ran against, whether the tree was clean, and `Detail`.

**`-Quiet` suppresses the human-readable report only.** The result object is always emitted, and no
parameter may ever suppress it — a caller that cannot see the result cannot tell a clean run from a
run that did nothing.

**No parameter may cause a write.** There is no `-Fix`, no `-Write`, no `-Apply`, and none may be
added (SS1). A checker that could fix what it finds is a generator, and a generative pass over the
design documents is the loop `AGENTS.md` § *The design freeze* exists to escape.

`Get-SpecSetExitCode` throws on an unrecognised state rather than returning a default. A silent
fallback to 0 is the one failure mode that turns this tool into a liability.

### The marker vocabulary

Authors write these; no code declares them, so this is their only home. The four id forms are in
*Authored records* above. Binding on the corpus:

- A region's opening and closing markers must match and must not nest.
- An id must be unique corpus-wide.
- A region must have a non-empty body.
- `provisional-register` occurs exactly once across the whole corpus.

### `.github/workflows/verify.yml`

Created by the slice that lands the checker. Carries at least two steps flagged
`# verification: true` on the line immediately above their `- name:`, per `/verify`'s discovery
rule: one running the checker, named `Check the spec set`, and one running the Pester suite over
`tools/`, named `Run Pester tests`.

**Exit 1 and exit 2 both fail the step.** A run that could not evaluate is not a pass, and CI going
red on 2 is what stops "could not look" from being read as "nothing wrong". Which of `/verify`'s
three lists the gate lands in is a separate question from whether CI is red, and is `/verify`'s to
answer.

The step names are the surface: `/verify` names discovered gates by the step's own `name:`, so
renaming one renames a gate in every report that mentions it.

## Error semantics

Non-retryable, all of them, everywhere. Every path is a local, deterministic, read-only pass over
files on disk. There is nothing to retry, no partial write to roll back, and no state left behind.

### Index — `Read-SpecSet.ps1`

Every variant yields `State = 'NotEvaluated'`, exit 2, and names the file and line. **The extractor
never guesses and never partially matches** (SS7). The danger in pattern-matching a language is not
that it fails; it is that it silently matches less than it should and the report calls the corpus
clean. A declaration the index skipped is a declaration no check examined.

| Reason | Raised when | Caller does |
|---|---|---|
| `UnreadableDocument` | A corpus file cannot be opened or decoded as UTF-8 | Fix the file; check encoding, per `agent.md` on CP1252 imports |
| `UnknownDeclarationForm` | A fence contains a construct the restricted grammar does not accept | Extend the grammar, or rewrite the declaration into a known form |
| `MalformedRegion` | A marker is unclosed, mismatched, or nested | Fix the markers |
| `DuplicateRegionId` | Two regions share an id | Rename one |
| `CorpusNotFound` | `-CorpusPath` does not resolve to a directory | Fix the invocation |

`UnknownDeclarationForm` becoming frequent is the countable condition that reverses
`90-decisions.md` (2026-08-20, restricted grammar). When status 2 stops meaning "look at this" and
starts meaning "run it again", the real parser has become correct.

### Checks — `Test-SpecSet.ps1`

A check produces findings, not errors. Findings yield `State = 'Invalid'`, exit 1.

| CheckId | Finding raised when |
|---|---|
| `mirror` | An obligated closed declaration has a member absent from its region body, or the body names a member the declaration does not have |
| `mirror` | A mirror obligation names an open declaration, or a declaration that does not exist |
| `provisional` | A register row has an empty `Reason` or an empty `Settles when` cell |
| `provisional` | A provisional site has no register row, or a register row has no site |
| `concept` | A state-bearing concept has no `lifecycle-` region |
| `concept` | A lifecycle region states creation but not retirement, or retirement but not creation |
| `reference` | A section or document reference resolves to nothing |
| `reference` | A cross-repository reference carries no pinned sha |

A check that cannot complete records an **unchecked** entry rather than a finding, which forces the
run to `NotEvaluated` and exit 2:

| Reason | Raised when | Caller does |
|---|---|---|
| `CrossRepositoryUnresolvable` | A reference targets SubZeroDev.GameEngine | Nothing; this is the permanent steady state, not a degraded one |
| `RegisterAbsent` | No `provisional-register` region exists | Author it, or accept that the third brief condition is unchecked |

**A cross-repository reference is never reported as passed and never as broken** (SS9). Absent
evidence is not evidence of either. Treating them as fine is how a whole class of reference rots
unnoticed; treating them as broken makes the check unusable without a second checkout and trains
the author to ignore it.

### Report and Runner

| Reason | Raised when | Caller does |
|---|---|---|
| `NotAGitRepository` | The commit stamp cannot be read | Run from inside the repository |
| Unknown state | `Get-SpecSetExitCode` receives a state it does not know | Nothing — it throws; this is a defect in the caller |

**Status 2 takes precedence over 1** (SS5), matching `Test-Companion.ps1` and `Test-DesignState.ps1`.

## Invariants

The highest-value section. Each is written so it could become an assertion. **Enforced-by-code**
means a test fails when it is broken; those are the only ones a reader may trust without checking.

| Id | Invariant | Owner | Enforcement |
|---|---|---|---|
| **SS1** | No module opens any path under the corpus for writing, and no parameter enables it | All | Code — AST inspection asserts no write cmdlet takes a corpus path, and no `-Fix`/`-Write`/`-Apply` parameter exists |
| **SS2** | Every regular expression in the system is in `Read-SpecSet.ps1` | Index | Code — AST inspection finds no match operator or `[regex]` outside that file |
| **SS3** | No check function reads a file | Checks | Code — AST inspection finds no file cmdlet inside any check function |
| **SS4** | No check calls another check | Checks | Code — a check receives records and returns findings; the call graph is asserted acyclic and flat |
| **SS5** | If any check is unchecked, the run exits 2 regardless of findings | Report | Code |
| **SS6** | Every obligation, register row, concept, and reference is in exactly one of held, failed, or unchecked | Report | Code — the three counts sum to the index's totals |
| **SS7** | An unrecognised construct stops the run; nothing partial is reported as complete | Index | Code — the grammar's fallback branch raises, and a test feeds it an unknown form |
| **SS8** | Closure is derived from a declaration's form and can be set by nothing else | Index | Code — no marker id, parameter, or config key names closure |
| **SS9** | A cross-repository reference is reported unchecked, never passed, never broken, and no parameter can change that | Checks | Code — asserted alongside SS1's no-write-parameter check |
| **SS10** | The report names the commit it ran against and whether the tree was clean | Report | Code |
| **SS11** | A finding states that two documents disagree and never which is stale | Checks | Instruction — `SpecFinding` has no field for it, which is the enforcement available |
| **SS12** | Every marker is an HTML comment; removing the checker leaves the corpus valid, publishable markdown | Corpus | Code — the docs build has no dependency on the checker, and a test asserts markers render nothing |
| **SS13** | Every register row has a non-empty `Reason` and a non-empty `Settles when` cell | Checks | Code |
| **SS14** | `04` §22.2 is the sole provisional register; every other list of provisional numbers is a pointer to it | Corpus | Code — exactly one `provisional-register` region corpus-wide |
| **SS15** | Only a closed declaration may carry a mirror obligation | Checks | Code |
| **SS16** | A clean run is never reported as "`03` and `04` are consistent" | Report | Instruction — the report states the obligation count checked, and the wording is fixed in `Write-SpecSetReport` |
| **SS17** | Every cross-repository claim pins a sha, in the `<path> § <section> @ <sha>` form `AGENTS.md` already uses | Corpus | Code |

**SS16 is the bound on what this machinery may claim, and it is the one an author is most likely to
forget.** The checker proves that declared obligations hold. It cannot prove the obligation set is
complete, because completeness is a reading and nothing can compute "describes". A report that
implied otherwise would be worse than no report at all: it would retire the full-audit read that
currently catches everything the extractor cannot see. Path 1 exists to retire the counting, not
the reading.

**SS11's enforcement is deliberately weak, and the weakness is recorded rather than fixed.** No test
can tell whether a `Detail` string editorialises. Removing the field would make findings useless.
The structural mitigation is that `SpecFinding` carries no `Culprit`, `Stale`, or `Correct` field
for anyone to populate.
