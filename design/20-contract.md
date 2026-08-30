# Contract — Life in the Fast Lane repository

The spec-set path and the content path are both derived from [`10-design.md`](10-design.md), which
designs them as its two systems. The installed design-state path is restored from the AgentKit
commit pinned in [`.claude/kit.json`](../.claude/kit.json). Binding on every slice.

The systems contracted here are the **spec-set checker**, the **marker vocabulary** the corpus
carries for it, the **content path** — the campaign sources, the exporter, the clean check, and
the pinned engine they are authored against — and the installed **design-state mechanism**. The
corpus's own meaning — the game, the engine, the numbers — is not this document's subject and is
never constrained by it, and neither is a campaign's content. **What the content path contracts is
how content is built, published and checked, never what it says.**

Spec-set invariant ids are prefixed `SS` and content-path ids `CP`. Both are separate namespaces
from the `I<n>` ids that `AGENTS.md` and `.claude/commands/*.md` cite, which belong to the agent
kit contract restored here.

**Scaffold notice.** Declarations below marked *scaffold* exist here only until the slice that
materialises them lands. That slice replaces the block with a pointer to the declaring file in the
same commit, and what remains is the surrounding semantics. Nothing in this document may be read
as authorising a second copy of a declaration the tree carries.

## Contract scopes

This repository has three standing contract paths:

- The spec-set checker derived from design/10-design.md in this repository.
- The content path — the campaign sources, the exporter, the clean check, and the pinned
  engine — derived from design/10-design.md, system 2, in this repository.
- The installed AgentKit design-state mechanism shipped by the commit pinned in
  .claude/kit.json. The pin is provenance only: all installed checks remain offline and
  resolve their contract from this file and the local tree.

A later contract run for any one path preserves the other two. No path may rewrite the file
from a blank document. Names prefixed SS belong to the spec-set path; names prefixed CP belong
to the content path; names prefixed I and the divergence classes belong to the installed
design-state path.

**The three namespaces never merge, and an id is never reused across them.** SS and CP are
hand-authored here and carry no design/state/ records; the I rows are the installed mechanism's
invariant unit set and are projected from those records. A content-path invariant is
deliberately not a design-state invariant record: giving it one would require src/campaigns/ and
scripts/ to become a unit kind, which § *Artifacts of a unit kind* does not name and which is
the installed path's policy rather than this one's.

## Types

### Installed design-state records

The record grammar, field tables, factories, and result shapes are declared in
tools/Read-DesignState.ps1 and tools/Test-DesignState.ps1. This contract carries the semantics
their declarations cannot express:

- Derived edges are never authored. Consumers, BoundBy, Decision.Affects, and
  Question.Affects exist only as projections. Contract.Owner is the only authored reverse
  edge, and OwnerMismatch checks it.
- Omitted and empty lists are different facts. Every list-valued field is present, empty when
  it has no members; an absent scalar has no value.
- Retired records keep their ids resolvable, leave every orientation closure, and stop having
  their anchors checked. No other meaning changes.
- Archival is excluded from the orientation closure. A closure is exactly one hop and is
  measured from whole record files.
- A code-enforced invariant requires Evidence. A superseded decision requires SupersededBy.
  An answered question requires AnsweredBy.
- WorkRef is a mirror, never authority. MirroredAt and Rank are always present.
- Reader failures reproduce the offending line verbatim and never discard records that did
  parse.

Marked-region identity and form consistency are defined under Authored records below and apply
to both contract paths.

### Spec-set records

Eight record types. Four derived, four authored. The split is the load-bearing distinction and is
not an implementation detail: a derived record cannot drift from the corpus, and an authored one
can, which is why only the authored ones are checked for well-formedness.

### Derived records

Recomputed on every run from the markdown and discarded when the run ends. They have no
persisted form, no identity across runs, and no serialisation. Nothing may write them anywhere.

The four derived record classes are declared in [`tools/Read-SpecSet.ps1`](../tools/Read-SpecSet.ps1).

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
A region's identity is `(document, id)`, so one id may be reused in different documents. The id
still has one form repository-wide: if any document uses an id as projected, no document may use
that id as declared, and vice versa. This is the collision rule `AGENTS.md` already states. Within
one document, an id occurs at most once.

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

**An obligation asserts that its body is a *complete* restatement of the declaration's membership,
and there is no partial form.** Every member must be named in the body by its identifier; a member
the body omits is a finding, and so is a name the body carries that the declaration does not
declare. This is not a strictness that could be relaxed later — it is the whole check. The defect
the brief names is `wisdom`, a member **missing** from a list, so an obligation that tolerated
subsets would have passed the one case this machinery exists to catch.

**What that costs, stated rather than left to be discovered: the obligation set is small and does
not grow on its own.** A site that describes part of a declaration is not a weak obligation, it is
not an obligation — `03` §12.1 names four of `RelationshipState`'s ten members, and §13.3's
"Classic Mode / Open Life Mode / Challenge Mode" does not contain `classic`, `open_life` or
`challenge` as identifiers, so neither can be obligated as written. Such a site is reduced per
`90-decisions.md` (2026-08-20, reduce the mirrored surface) or left to the full-audit path; making
it obligable means editing `03` to restate more of `04`, which is that decision's rejected
direction and is a change to `03`'s prose, not a marker.

**So the brief's second condition is mechanically covered where `03`'s prose is already exhaustive
and nowhere else**, and the bound is smaller than `10-design.md` § *Data model* reads as implying.
It sits beside SS16's bound rather than under it: SS16 says the obligation set cannot be proven
complete, and this says that even a complete set would reach only the exact restatements. Both
limits are why the full-audit path is not retired by any of this.

**A concept is a state-bearing entity** — something `04` holds in game state. Stateless mechanisms
(the eviction ladder, promotion, the check formula) are outside the derived concept set and are
judged on the full-audit path. This bounds the fourth brief condition to something enumerable from
the index; the broad reading is not enumerable mechanically at all, and a check that cannot know
what is missing does not check completeness.

### Content path records

Nine record classes, five authored and four derived, and the authored/derived split answers the
same question system 1's does with the opposite result: **every derived record here is
committed.** That is not a relaxation of the rule against second copies, it is the rule paid
for. A copy regenerated in full from its source by a deterministic program, and compared against
the source on every run, is a cache; a cache with a gate cannot be stale for longer than one
commit. Remove the gate and the justification goes with it, which is why CP5 and CP6 are not
optimisations available to a later slice.

#### Authored

| Record | Identity | Declared in |
|---|---|---|
| Campaign source | Campaign id | [`src/campaigns/stable-life.ts`](../src/campaigns/stable-life.ts), as the engine's `SimulationCampaignSource` |
| Build function | Its campaign | The same file, returning the engine's `CommandResult<BuiltCampaign>` |
| Catalog card | Its campaign | The same file, as the engine's `PortableCatalog` |
| Publication catalog | The exporter's ordered entry list | [`scripts/export-content.ts`](../scripts/export-content.ts) |
| Engine pin | The submodule commit | `.gitmodules`, and the gitlink each commit records |

**Every collection `SimulationCampaignSource` requires is present, and an unwritten one is empty
rather than absent** (CP7). The two are not interchangeable: empty is an honest statement that
the content has not been written, and absent is indistinguishable from a source that got the
shape wrong. A consumer may rely on the collection existing and may not read its emptiness as a
defect.

**The catalog card is authored beside its campaign and is never assembled by the exporter.** Its
fields are what a host shows a player *before* loading, and two of them are content-fitness
statements rather than presentation flags: a campaign whose collections are mostly empty is
hidden and says so in as many words. What lifts a campaign out of that state is *Unresolved* 2 —
no code here decides it, and none may acquire the power to.

**The publication catalog is the boundary between existing in the tree and being published.** A
source absent from it is unpublished however finished it looks, and there is no second route in:
no directory scan, no naming convention, no flag on the source itself. This is the one record
whose *ordering* is meaningful — it is the order a host presents, and the order the manifest is
written in.

**The engine pin is a commit, never a range**, and it is what determines the surface every
campaign source compiles against. `package.json` resolves the dependency to a path inside the
submodule rather than to a registry, so there is no version negotiation and no resolution step
that could pick something else.

**No local variant of an engine-owned type exists.** The portable form, the manifest, and the
catalog card are the engine's published types, consumed as declared. Extending one here is the
consumer-stops-being-a-consumer failure CP1 exists to prevent, and it is the reason provenance
is not recorded in the manifest — `90-decisions.md` (2026-08-30, provenance) rejected that by
name, and the correct route for a host that needs it is the engine repository.

#### Derived

| Record | Derived from | Persisted |
|---|---|---|
| Built campaign | A campaign source, through the engine's builder | No — in memory for one export or one test |
| String table | The LocKeys the source authors, lifted by the builder | Only as part of the portable form |
| Portable campaign | A built campaign plus its catalog card | `content/<file>.json`, committed |
| Manifest | The exported set | `content/manifest.json`, committed |

**A campaign has three names and they answer different questions.** The file name is what a host
can construct without reading anything; `(id, version)` is what it addresses and caches by; the
digest is what the content actually is. They can disagree, and the disagreement is silent:
editing a source without changing its version moves that campaign's digest, moves neither the
address nor the manifest's resolution digest — which is computed over the `(id, version)` pairs —
and a host caching on the address serves the old campaign with no way to learn otherwise.

**Nothing here prevents that, and this document may not settle it.** Whether a content change
requires a version bump is a compatibility promise to an external consumer, so it is *Unresolved*
1 rather than a rule invented at contract time.

**Nothing in this repository reads a file under `content/`** (CP3). The clean check reads git's
report about the directory, never its contents, and that distinction is what keeps the content
path from closing a loop through its own output.

## Persisted schemas

### Installed design-state schema

design/state/ is persisted local contract state, one UTF-8 LF Markdown file per record:

| Id | File |
|---|---|
| unit/<kind>/<slug> | design/state/units/<kind>/<slug>.md |
| I<n> | design/state/invariants/I<n>.md |
| contract/<slug> | design/state/contracts/<slug>.md |
| decision/<date>-<slug> | design/state/decisions/<date>-<slug>.md |
| question/<slug> | design/state/questions/<slug>.md |
| work/<issue> | design/state/work/<issue>.md |

The file path is the primary key and the Id line must agree with it. Enumeration is a directory
walk: there is no manifest, cache, lock, lease, or coordination file. Git is the arbitration
mechanism.

Migration preserves the existing WorkRef records byte-for-byte and adds records only for
artifacts and decisions that already exist. It must not create an artifact merely to give a
record an anchor, must not alter any existing decision-log entry, and must not infer a resolved
question. Missing information is reported, not invented.

### Spec-set checker persistence

**The checker persists nothing.** No database, no cache, no sidecar, no report file, no state
directory. Every derived record is recomputed per run and discarded. A run that fails leaves the
corpus byte-identical to how it found it.

**Migration story: none, and it is a constraint rather than an absence.** There is no persisted
artifact to migrate because persisting one would create the second copy of `04`'s declarations
that `90-decisions.md` (2026-08-20, sidecar) rejected. A future slice that introduces a cache is
amending this contract, not optimising within it.

The corpus itself is the only persisted state, and the checker's schema over it is the marker
vocabulary above plus one table shape.

**Adding markers is additive**, which is why the corpus could acquire the ones it now carries
without a migration step: a document with no regions is valid input yielding zero obligations
rather than an error, and that is still true of every document that has none.

### The provisional register's table shape

**SS13 requires four columns** — `Area`, `Call made`, `Reason`, `Settles when`. `04` §22.2 once
had three, the last folding the reason and the settling condition into one free-text cell. The
split is not cosmetic, and the reason it is binding outlives the migration that performed it: with
one column the check has to decide whether a sentence contains a settling condition, which is
judgement over prose and exactly what `10-design.md` establishes cannot be computed. With two, the
check is "the cell is non-empty" — set arithmetic, which is the only kind of check this system is
allowed to make. A future row that folds them back is a finding, not a formatting choice.

**The migration is done, and the row it was expected to fail on was settled rather than
invented.** The six rows gained the column, and the `§8.7 Housing quality` row — whose reason was
"Pure balance; expect it to change" — had no settling condition to move into the new cell and was
a `provisional` finding on the first run, which is the brief's third condition catching the first
thing it was written to catch. It was closed by asking rather than by inventing a condition, per
`90-decisions.md` (2026-08-22, housing quality settling condition). **The rule that produced that
outcome still binds every later row: a row missing a condition is written or deferred on the
record, never migrated by inventing one.**

`.claude/gates.json` and `.claude/verify-report.json` are written by `/verify` and
`tools/Test-GatesCache.ps1`, not by anything in this contract. The checker returns a result object
and an exit code; what consumes them is not its concern.

### The published content directory

`content/` is the content path's only persisted artifact and every byte of it is derived. One
file per published campaign, named by its catalog entry, plus the manifest. The manifest's
`formatVersion` is the engine's field and the engine's to move; this repository does not own a
format version of its own and may not introduce one.

**Keys and indexes: none, and that is the schema.** The manifest is a regenerated projection of
the publication catalog, not a registry maintained beside it, so there is nothing to keep in
sync and no index that can disagree with the directory it describes. The three names a campaign
has are set out under *Content path records* above.

**Migration story: none, and it is a constraint rather than an absence.** There is no data at
rest to migrate, because the directory is a pure function of the campaign sources and the pinned
engine and is recomputed in full on every export. A change to the portable form's shape is an
engine change: it arrives with a pin move and lands as a JSON diff in the same commit (CP14),
which is the only place a behavioural change in the engine becomes visible to a person.

**A slice that introduces a hand-maintained file under `content/` is amending this contract**,
not optimising within it — an expected-digest list, a provenance sidecar, or an index. Two of
those three are already rejected by name: the digest list by `90-decisions.md` (2026-08-30,
committed export checked by regeneration, restated in `10-design.md` § *Alternatives considered*
6), because a hand-maintained expected hash is a second copy of the output's identity; and the
provenance sidecar by `90-decisions.md` (2026-08-30, provenance).

**Recovery depends on the export being tracked.** A crash part-way through writing is the only
partial-failure window in either system; builds and validation are complete by then, so what is
left is a directory where some files are new and some are old. The recovery is to discard the
working tree's changes under `content/`, which restores the last committed export exactly. That
property is the second reason the output is committed, after the host, and it does not survive a
decision to build on demand.

**Nothing under `content/` is hand-edited** (CP8). An edit survives until the next export and is
then overwritten; a new file placed there is deleted by it. Neither is reported as an error and
neither should be — the catalog owning which files exist is what makes a retired campaign
actually disappear rather than linger as a document a host still fetches.

### The engine pin

Recorded twice, in two forms: `.gitmodules` names the repository, and the gitlink in each commit
names the exact tree the content was authored against. Together they are the whole provenance
record, and the artifact adds nothing to them.

**The pin locks one direction only.** It says which engine this content was authored against. It
says nothing about which engine a host will run it on, and no mechanism here could — the
published artifact's compatibility with a future engine version is the engine's contract to
keep. A field here implying otherwise would be a claim this repository cannot honour.

## Public surface

### Installed AgentKit surfaces

The parameter lists and result fields are declared in the named files and are not repeated here.
The following semantics are binding:

#### tools/Wait-PullRequestCheck.ps1

HeadSha remains mandatory and has no default. The script always emits its WaitResult, including
on failure; exit codes are 0 Passed, 1 Failed, 2 NotEvaluated. It never prompts, reruns a check,
merges, resolves, or writes.

#### tools/Test-DesignDrift.ps1

Read-only against both sides. Exit 0 means no drift, 1 means drift, and 2 means the comparison
could not be completed. An unparseable criterion id is reported and never dropped.

#### tools/Test-Companion.ps1

The category vocabulary comes from .claude/COMPANIONS.md. Missing, empty, and frontmatter-only
companions are absent rather than overrides. Exit codes are 0 Valid, 1 Invalid, 2 NotEvaluated.

#### tools/Read-DesignState.ps1

Emits a graph and never throws for malformed state. Every unrecognised line is reported verbatim.
It writes nothing. An absent state set is an empty graph; the checker decides what absence means.

#### tools/Test-DesignState.ps1

Always emits Findings, Reported, and CouldNotEvaluate. Exit 2 takes precedence over exit 1.
Closure size is the sum of whole record files. It names the largest closure on every completed
run, regenerates before comparing projections, normalises line endings only, and writes nothing.

#### tools/Update-DesignProjection.ps1

DryRun writes nothing. A normal run writes only inside an existing projected region, never
creates a region, never writes inside a declared region, never reads a rendered region as input,
and is idempotent and order-independent.

#### tools/Update-WorkMirror.ps1

Only /track invokes it. It writes WorkRef records only, stamps MirroredAt on every write, and
always supplies Rank using project order, then milestone, then issue number. An unreachable
tracker is NotEvaluated and never an empty mirror.

#### .claude/commands/fix.md

Implements against one bug issue agent block, reproduces first, never edits design/, never opens
an issue for an unreproduced defect, and never absorbs a contract or public-interface change.

#### .claude/commands/resolve.md

Classifies the full thread table before acting. It delegates head-specific check observation to
Wait-PullRequestCheck.ps1 and resolves only a satisfied Defect-class thread under AGENTS.md.

### Artifacts of a unit kind

This table is the canonical policy input for GlobDisagreement. Both pattern cells contain tokens
only. Parsed patterns are expanded only for comparison; they never drive artifact enumeration.

| Kind | Glob | Excluded |
|---|---|---|
| command | `.claude/commands/*.md` | `*-local.md` |
| script | `tools/*.ps1` | `*.Tests.ps1` |
| document | `design/*.md`, `templates/design/*.md`, `*.md`, `.claude/COMPANIONS.md`, `.github/ISSUE_TEMPLATE/*.md`, `codex/PROFILES.md` | `design/FROZEN.md`, `CLAUDE.md` |
| invariant | not a tree path | — |

The invariant kind is the I<n> rows in Invariants below. The other three kinds are resolved from
the table and independently enumerated by the checker; any difference is GlobDisagreement.

### Spec-set checker surfaces

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
`Valid`, `Invalid`, or `NotEvaluated`; it carries `Findings`, `Unchecked`, `Unresolvable`,
per-check counts, the commit it ran against, whether the tree was clean, and `Detail`.
**`Unresolvable` is a separate list from `Unchecked` and never merges into it, and a consumer
reading only `State` cannot recover it** — which is why SS18 puts it in the report rather than
leaving it to be inferred.

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
- A `(document, id)` pair must be unique, and one id must not appear in both marker forms anywhere
  in the repository.
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

### Content path surfaces

#### A campaign source — `src/campaigns/<slug>.ts`

Declared in [`src/campaigns/stable-life.ts`](../src/campaigns/stable-life.ts), today's only
campaign. It exposes the source object, the catalog card, the campaign's id and version, and a
build function; every other consumer of a campaign reaches it through those.

**The build function is pure and total.** No I/O, no clock, no randomness, no environment read.
The determinism of everything published rests entirely here, and nothing downstream would
diagnose a violation — the export would simply produce different bytes on each run, and the
clean check would go red on a commit that changed nothing, which is the one failure mode that
trains an author to re-run a gate rather than read it.

**A failure is data, not a throw.** The build function returns the engine's `CommandResult`, and
`ok` does not narrow `value` — every caller checks both. A source that threw instead would move
its failure out of the exporter's build-everything-first phase and into the middle of it, which
is what CP4 forbids.

**A campaign source may import nothing but the two published engine specifiers and this
repository's own sources** (CP1). The submodule places the engine's entire source tree a
relative path away, so the compliant form and the violating form both typecheck and both run;
the difference appears only when the pin moves, or when someone tries to run this campaign on a
published engine version.

**Section citations are for a reader and are resolved by no program** (CP9). The `§` references
into `docs/docs/games/` are the only link in either direction between a campaign and the
specification it was transcribed from, and their rot after a renumbering is the full-audit
path's to catch.

**Where the pinned engine cannot express a requirement the corpus states, the source omits it
visibly and names the omission** (CP10). Never approximate: an approximation is a silent
divergence between the campaign and the spec it was authored from, in the one artifact whose
entire purpose is to be evidence that the two agree.

#### `scripts/export-content.ts`

Declared in [`scripts/export-content.ts`](../scripts/export-content.ts). The `entries` list is
the publication catalog and is this file's most important surface.

**It is the only writer in either system, and `content/` is its only write target** (CP2).

**It builds every campaign and validates the whole set before writing any file** (CP4), so an
authoring or validation failure leaves the directory byte-identical. That ordering is the
difference between a failed export and a half-published catalog the next consumer fetches.

**The serialization form is contracted, not a formatting preference.** Two-space indentation,
exactly one trailing newline, and the manifest written in catalog order. The clean check
compares bytes, and the diff is the only place a behavioural change in the engine becomes
visible to a person; minifying the output would remove the second of those and break the first.

**It removes every `.json` under `content/` the catalog does not name** (CP6). That is what
makes a retired or renamed campaign disappear rather than linger.

**No parameter may make it write elsewhere or write a subset.** There is no `--out-dir` and no
`--only`, and adding either defeats CP4 and CP6 at once: a partial export is indistinguishable
from a stale one to the clean check, which is the only thing standing between a source edit and
a silently unpublished change.

#### `scripts/check-clean.mjs`

Declared in [`scripts/check-clean.mjs`](../scripts/check-clean.mjs). Reads git's report on
`content/` and nothing else; writes nothing, anywhere.

**The comparison is scoped to `content/` deliberately** (CP11). An unrelated dirty working tree
is the author's own business and is not this gate's to fail on.

**No parameter may relax it.** There is no `--allow-dirty`, no ignore list, and no whitespace
tolerance. A gate that is sometimes wrong is worse than no gate, because the habit it trains is
re-running it.

**It never exits 0 for a comparison it could not make** (CP13). A missing git, or a directory
that is not a checkout, is a gate that did not run, and reporting that as a pass is the
fabricated-gate-result failure `AGENTS.md` § *Verification* exists to prevent.

#### `package.json` — the composed gate

The script names are the surface an author and CI both invoke: `setup`, `typecheck`, `test`,
`export:content`, `check:clean`, and `check` composing the last four.

**The order is load-bearing and the steps are not a set** (CP12). The export transpiles rather
than typechecks, so an export invoked first can publish from sources that do not compile; and
the clean check has nothing to compare until the export has run. Renaming a script renames a
step in every gate report that mentions it.

#### `.github/workflows/verify.yml` — the `content` job

Carries the content path's steps, each flagged `# verification: true` on the line immediately
above its `- name:`, per `/verify`'s discovery rule. The step names are the surface: `/verify`
names discovered gates by the step's own `name:`.

**The checkout must be recursive.** The engine is a pinned submodule and the campaign sources
compile against it; without it the job resolves nothing and every step fails for a reason
unrelated to the change under test.

**No step may swallow its exit code**, by `continue-on-error` or otherwise. Each failure names
itself, which is why CI runs the steps individually rather than invoking the composed `check`.

## Error semantics

### Wait-PullRequestCheck.ps1

| WaitFailure | Raised when | Retryable | Caller does |
|---|---|---|---|
| HeadMoved | HeadSha is not the pull request current head | Yes, with the new SHA | Re-read the head; never retry the old SHA |
| TimedOut | A check remains non-terminal at the deadline | Yes | Report the named checks as did-not-run; do not resolve |
| UnknownBucket | The provider returns an unknown bucket | No | Stop and report the bucket verbatim |
| NoChecksConfigured | The pull request reports zero checks | No | Report that nothing was evaluated |
| GhUnavailable | gh is absent or unauthenticated | No | Report a gate that did not run |
| PullRequestMissing | No such pull request exists | No | Stop |

State Failed is not an error: the script successfully determined that a check failed. Every
failure returns a structured WaitResult rather than throwing a bare string.

### The divergence classes

**This is the closed list.** `Test-DesignState.ps1` declares the same ids and one blocking class
compares the two; the script is the detection and this document is the policy. A class not on
this list does not exist, and adding one is a contract amendment.

**Blocking.** Every one is evaluable from the checkout alone — no network, no tracker, no
running service (I22). That rule is what decides membership; it is not a coincidence of the
list.

| Class | Raised when | Caller sees |
|---|---|---|
| `UnresolvedId` | A record names an id with no record | The referring record and the missing id |
| `AnchorMissing` | An **active** record carries a tree-pointer field naming a path not in the tree — a unit's `Anchor`, a contract's `Declaration`, or any entry of an `Evidence` list | The record, the field, and the path. **Which of the two sides is wrong is the user's call** |
| `OwnerMismatch` | A contract's `Owner` is not the unique active unit whose `Exposes` names that contract — nobody exposes it, or two units do | The contract, its `Owner`, and every unit exposing it |
| `UnrecordedArtifact` | A tree artifact of a unit kind has no record | The unrecorded artifact |
| `ProjectionStale` | A region differs from its regeneration, after line-ending normalisation | A diff of the region |
| `RegionMalformed` | A marked region of either kind is unbalanced or nested | The document and the marker |
| `IdCollision` | An id is duplicated, renumbered, disagrees with its file path, or appears in both the projected and the declared marker form | Every file claiming it |
| `DecisionAnchorAmbiguous` | A decision anchor resolves to zero or two log headings | The anchor and the count |
| `LogEntryUnrecorded` | A log heading has no decision record | The entry's heading |
| `EnforcementUnevidenced` | A conditionally-required field is absent on a record whose own `Status` or `Enforcement` requires it — an invariant with `Enforcement: code` and no `Evidence`, a decision with `Status: superseded` and no `SupersededBy`, or a question with `Status: answered` and no `AnsweredBy` | The record, the absent field, and the value that required it |
| `ClosureOverBudget` | A closure exceeds 16,384 bytes | The unit, its size, and its largest contributor |
| `ClassListDisagreement` | The checker's declared class ids differ from this document's list | Both sets, and the difference in each direction |
| `GlobDisagreement` | For a globbed unit kind, the file set § *Artifacts of a unit kind*'s patterns resolve to differs from the set the checker's enumeration returns | The kind, the direction, and the paths |

**`GlobDisagreement` compares file sets, not tokens, and only in that direction.** Comparing the
patterns as text would be a third id-level check in a document that already knows id-level checks
miss definition drift — the very complaint two paragraphs below. Resolving both sides against the
checkout instead means the table is checked for what it *means*, and it is what qualifies the
class as blocking under I22 on the rule's own terms: expansion needs the checkout and nothing
else. The `invariant` kind is outside the comparison because it has no pattern in either cell,
which is a fact about the table rather than an exemption the checker carries.

**What a set comparison cannot see, stated rather than left to be found: an exclusion that
excludes nothing in this checkout.** `*-local.md` is the standing example — the cell's own reason
is that this repository ships no companion — so removing it from the table changes no resolved
set here and the class stays silent. That is the comparison working as specified, not a hole in
it, and the exposure is bounded by the same fact that causes it: a divergence invisible here is
invisible because it has no artifact here to be wrong about. It becomes visible in the first
checkout that has one.

**`AnchorMissing` is named for a unit's `Anchor` and checks every tree pointer a record
carries.** `Contract.Declaration` and the `Evidence` list on a unit or an invariant record are
restatements of a tree path exactly as `Anchor` is, so leaving them unresolved is the unchecked
restatement I15 forbids — and it was already live, because unit records carry `Evidence` today.
One class covers all three because the check, the remedy, and the reason each is evaluable from
the checkout alone (I22) are the same in every case; a second class would have split one rule
across two ids and widened the closed list for nothing. **The name reading narrower than what
it checks is the price, and it is paid deliberately** — renaming it costs the closed list, the
checker's declared ids, and the tests that cite it by name.

Three exemptions, each of which would otherwise block forever:

- **A retired record is exempt entirely** (I30). Its artifact is gone by definition, which is
  why it was retired.
- **An invariant record's `Anchor` is the invariant number, not a path.** Its resolution check
  is well-formedness and uniqueness, and it is `IdCollision`'s, never `Test-Path`'s.
- **A contract's `Declaration` of the literal `prose` resolves to nothing on purpose.** A
  Markdown command surface has no declaration to point at, and that is the field's documented
  second value rather than an absent path.

**`EnforcementUnevidenced` is named for the invariant case and covers all three conditional
requirements**, on the reasoning that widened `AnchorMissing` rather than splitting it. A scalar
is omitted when it has no value, so a conditional scalar's absence is indistinguishable from a
field nobody filled in; the check, the remedy, and the reason each is evaluable from the checkout
alone (I22) are identical in all three cases, and a second class would have split one rule across
two ids for nothing. **The name reading narrower than what it checks is the price, paid
deliberately and for the second time in this list.**

**A widened class definition is invisible to `ClassListDisagreement`, and that gap outlives the
widening that exposed it.** That class compares class *ids*, and an id does not change when what
it detects does, so a contract widened ahead of its detection stays green until the slice lands —
as this one did at S18, which is why the three cases above read as one rule rather than as one
rule and two intentions. **`GlobDisagreement` is the counter-example that fixes the shape of the
remedy rather than an exception to it**: the glob table used to be named here as the same silent
divergence, and what closed it was resolving both sides against the checkout instead of comparing
their names. A definition has no checkout to resolve against, so that remedy does not carry, and
nothing on the closed list closes this one.

**Reported, never blocking.** Each fails in exactly the environment where the failure means
nothing, which is why none of them is on the list above.

| Class | Raised when | Why it never blocks |
|---|---|---|
| `MirrorStale` | A `WorkRef`'s `MirroredAt` is not the current commit | The mirror is stale by construction; that is its documented state, not a divergence |
| `WorkStateDivergence` | A `WorkRef` disagrees with the tracker | Needs `gh`. A build that fails on an unauthenticated CLI reports an absent comparison as a divergence |
| `PinAncestry` | A cited commit is not an ancestor of the default branch | A shallow CI checkout has no history to answer with, and "could not check" must not read as "checked and failed" |
| `SemanticDisagreement` | A model judges a record's claim untrue | Permanently reported. The brief's *no formal specification of behaviour* non-goal puts it out of reach, and a build that fails on a model's opinion is a build nobody trusts |

**Could not evaluate.** Exit 2, and **never** a pass (I19, I20).

| `DesignStateFailure` | Raised when | Caller does |
|---|---|---|
| `StateSetAbsent` | `design/state/` missing, or present with zero records | Report that nothing was checked. The expected state in every installed target |
| `RecordUnparseable` | A line matches no production | Report the file, the line number, and the line **verbatim**. Never drop it |
| `TrackerUnavailable` | `gh` missing or unauthenticated | Report the tracker classes as not compared; the rest of the run completes |
| `ShallowCheckout` | No history for `merge-base` | Report that ancestry was not checked, and why. Never a pass |
| `ProjectorFailed` | `Update-DesignProjection.ps1 -DryRun` non-zero or absent | Report `ProjectionStale` as uncomputed, not as clean |
| `ContractListUnreadable` | A list this document is canonical for cannot be read or parsed — the divergence classes, § *Artifacts of a unit kind*, or § *Invariants* | Report the class it feeds as uncomputed: `ClassListDisagreement`, `GlobDisagreement`, or `UnrecordedArtifact`'s invariant half. **Read-and-disagrees is a finding; cannot-read is not** |

### The freeze

While `design/FROZEN.md` exists: every blocking class is **downgraded to reported**, the count
downgraded is stated, and the marker's `Frozen because` and `Lifts when` are reproduced
**verbatim**. Exit 2 still stands (I21).

A freeze permits known staleness. It does not permit a checker that could not run, and treating
those the same would make writing one file a way to switch the gate off — including for a
broken checker, which has nothing to do with the staleness a freeze is meant to permit.

### Spec-set checker errors

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
| `DuplicateRegionId` | A `(document, id)` repeats, or one id appears in both marker forms anywhere in the repository | Rename one region or make the form consistent |
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

A check that **could not complete** records an *unchecked* entry rather than a finding, which forces
the run to `NotEvaluated` and exit 2 (SS5):

| Reason | Raised when | Caller does |
|---|---|---|
| `RegisterAbsent` | No `provisional-register` region exists | Author it, or accept that the third brief condition is unchecked |

A check that **completed** against a subject a recorded decision placed out of reach records an
*unresolvable* entry. It is reported and counted on every run and **never changes run status**:

| Reason | Raised when | Caller does |
|---|---|---|
| `CrossRepositoryUnresolvable` | A reference targets SubZeroDev.GameEngine | Nothing; this is the permanent steady state, not a degraded one |

**The two lists exist because one word was doing two jobs, and the conflation had an exit code.**
*Unchecked* means the run is degraded: something environmental went wrong, it is nobody's intent,
and it is fixable — which is why it must fail the build, and why `AGENTS.md` § *Verification*
forbids reporting it as a pass. *Unresolvable* means the run finished and one of its subjects was
put beyond reach by `90-decisions.md` (2026-08-20, no `-EnginePath`). Nothing went wrong, nothing
is fixable, and no edit to this repository can ever clear it. Failing a build on the second is not
rigour: it is a gate that is red on every commit forever, which distinguishes nothing and stops
being read — the outcome that same decision rejects `-EnginePath`'s finding variant for.

**The unresolvable list is closed at `CrossRepositoryUnresolvable` and has exactly one member.**
Adding a second is a contract amendment, never a check's call, and the bar is the one this class
clears: a *recorded decision* — not a limitation, not an inconvenience, not a check that turned out
to be hard — must be what places the subject out of reach. Without that bar this category is a
drain the whole of SS5 leaks through, and it is the only thing bounding it.

**A clean run still names them** (SS18). A run that reports `Valid` while eight references went
unresolved must say so in as many words, because the reader's question is not "did the checker
finish" but "was this corpus checked", and for those eight the answer is permanently no.

**A cross-repository reference is never reported as passed and never as broken** (SS9). Absent
evidence is not evidence of either. Treating them as fine is how a whole class of reference rots
unnoticed; treating them as broken makes the check unusable without a second checkout and trains
the author to ignore it. Neither the split above nor the exit code it produces touches that: an
unresolvable entry asserts nothing about the reference except that this repository cannot see it.

### Report and Runner

| Reason | Raised when | Caller does |
|---|---|---|
| `NotAGitRepository` | The commit stamp cannot be read — the **checker's own** repository is resolved from the script's location, not from the caller's, so the working directory cannot cause this | Restore the checker to a checkout; a run from elsewhere is not the cause |
| Unknown state | `Get-SpecSetExitCode` receives a state it does not know | Nothing — it throws; this is a defect in the caller |

**Status 2 takes precedence over 1** (SS5), matching `Test-Companion.ps1` and `Test-DesignState.ps1`.

### Content path errors

**Non-retryable, every one of them.** Each path is a local, deterministic pass over files on
disk; the single writer writes one tracked directory that is regenerable in full and
discardable with a git restore. There is nothing to retry, no partial write that cannot be
thrown away, and no run that leaves state a later run must reconcile. A retry parameter anywhere
on this path is a contract amendment.

**A failure is reported as the engine's own structured errors, reproduced rather than
summarised.** The engine is the only thing that knows why a campaign did not build or why
validation rejected the set, and a reduction of that to a sentence is the loss the author then
has to reconstruct.

#### Exporter — `scripts/export-content.ts`

Every variant leaves `content/` byte-identical unless it is `WriteFailed`, because building and
validation both complete before the first write (CP4).

| Reason | Raised when | Retryable | Caller does |
|---|---|---|---|
| `CampaignDidNotBuild` | A build function returns a result that is not `ok`, or is `ok` with no value | No | Read the engine's errors; fix the campaign source |
| `ValidationRejected` | The engine's content-registry validation rejects the built set | No | Read the engine's errors; fix the source, or raise an engine gap per CP10 |
| `WriteFailed` | The filesystem rejects a write or a delete under `content/` | No | Discard the working tree's changes under `content/`, then re-export |
| `SurfaceChanged` | The pinned engine's types no longer satisfy a source — raised by the typecheck, before the exporter runs | No | Fix the source, or move the pin back. **Never widen an import to reach past the published surface** (CP1) |
| `SubmoduleAbsent` | `engine/` is uninitialised, or its pinned commit is unreachable | No | Initialise the submodule recursively and rebuild it before anything else on this path |

`SubmoduleAbsent` fails at the first command and cannot be mistaken for success, because no step
of the content path can run at all. That is the intended behaviour of a filesystem dependency on
a submodule path, and it is why the CI job checks out recursively.

#### Clean check — `scripts/check-clean.mjs`

| Reason | Raised when | Retryable | Caller does |
|---|---|---|---|
| `ExportStale` | The fresh export differs from what is committed under `content/` | No | Commit the re-export. **Nothing is auto-committed** — the fix is the author's |
| `GitUnavailable` | git is absent, or the working directory is not a checkout | No | Report a gate that did not run; never a pass (CP13) |

**`ExportStale` is the one failure a published-content repository cannot detect by reading
itself**, because the source and the output are each internally consistent and only their
relationship is wrong. It is the brief's own drift class reappearing in the half of the
repository that is code.

**Nondeterminism presents as `ExportStale` on a commit that changed nothing**, and the response
is fixed: it is a defect in the exporter or in the engine, and never a reason to relax the
comparison (CP5). A gate that is sometimes wrong is worse than no gate.

**A hand-edit under `content/` raises nothing** (CP8). It is overwritten, or the file is deleted,
on the next export. That is the catalog owning the directory, not a hole in the error taxonomy.

## Invariants

The I-prefixed rows are the installed design-state invariant unit set. This is a **projected**
region: it is rendered from design/state/invariants/*.md, those records are materialised, and
`ProjectionStale` fails when the two disagree. Do not hand-edit inside the markers — edit the
record and regenerate. SS-prefixed invariants below belong to the spec-set checker and remain
hand-authored.

<!-- invariants:start -->
| | Statement | Owner | Enforcement | Evidence |
|---|---|---|---|---|
| **I1** | No thread is resolved unless its class is `Defect`, its fix is in a commit reachable from `HeadSha`, and the `WaitResult` for that SHA has `State = Passed`. | `unit/command/resolve` | instruction | — |
| **I2** | `Wait-PullRequestCheck.ps1` never reports `Passed` or `Failed` for a SHA that was not the pull request's head at the moment it read the checks. | `unit/script/wait-pullrequestcheck` | code | tools/Wait-PullRequestCheck.Tests.ps1 |
| **I5** | Every `reviewThreads` query paginates to exhaustion before any thread is classified. | `unit/command/resolve` | instruction | — |
| **I6** | `/fix` never writes to `design/`. | `unit/command/fix` | instruction | — |
| **I7** | An unrecognised check bucket yields `NotEvaluated`, never `Passed` — the script fails closed. | `unit/script/wait-pullrequestcheck` | code | tools/Wait-PullRequestCheck.Tests.ps1 |
| **I8** | A pull request with zero checks configured yields `NotEvaluated`, never `Passed`. | `unit/script/wait-pullrequestcheck` | code | tools/Wait-PullRequestCheck.Tests.ps1 |
| **I9** | The delegation is unavailable in a repository the user does not own. Every action it covers is requested individually there, as today. | `unit/document/agents-md` | instruction | — |
| **I10** | `/fix` always implements against a bug issue's agent block — the one it was given, or the one it filed after reproducing. It never carries its own copy of those constraints. | `unit/command/fix` | instruction | — |
| **I11** | `/fix` never opens an issue for a defect it could not reproduce. That is a diagnosis report to the user, not a bug. | `unit/command/fix` | instruction | — |
| **I12** | `Test-DesignDrift.ps1` never reports a clean run for a comparison it could not complete — an unreadable tracker, an unparseable criterion id, or an unresolvable pin yields *could not evaluate*, never *no drift*. | `unit/script/test-designdrift` | code | tools/Test-DesignDrift.Tests.ps1 |
| **I13** | `Test-DesignDrift.ps1` writes nothing: not `design/`, not an issue, not git. It establishes that two sides disagree and stops there. | `unit/script/test-designdrift` | code | tools/Test-DesignDrift.Tests.ps1 |
| **I14** | No generated region is ever an input. Nothing reads a rendered projection back, and no record derives a field from one. | `unit/script/update-designprojection` | instruction | — |
| **I15** | Every restatement a record carries of a tree or log fact is mechanically resolvable, and a blocking class checks it. A restatement with no check is forbidden. | `unit/script/test-designstate` | instruction | — |
| **I16** | An id is assigned once, never reused and never renumbered. A record is retired, never deleted. | `unit/script/test-designstate` | instruction | — |
| **I17** | A derived edge is never written to a record. `Consumers`, `BoundBy`, `Decision.Affects` and `Question.Affects` appear only as projections; `Contract.Owner` is the sole written reverse edge and `OwnerMismatch` checks it. | `unit/script/read-designstate` | code | tools/Read-DesignState.Tests.ps1 |
| **I18** | No module of this mechanism writes outside a marked region: no source generated, no code edited, no divergence resolved, nothing written to git or the tracker. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1, tools/Update-DesignProjection.Tests.ps1 |
| **I19** | An absent or empty state set yields *could not evaluate*, never *clean*. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1 |
| **I20** | Findings and *could not evaluate* never collapse into each other, and exit 2 takes precedence over exit 1. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1 |
| **I21** | While `design/FROZEN.md` exists, no blocking class fails the build, and exit 2 still stands. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1 |
| **I22** | Every class on the blocking list is evaluable from the checkout alone — no network, no tracker, no running service. | `unit/document/design-20-contract` | instruction | — |
| **I23** | The orientation closure is exactly one hop, excludes `Archival`, and its ceiling is 16,384 bytes and never rises. It is measured as the sum of whole record files, never as the bytes of the fields a reader consulted. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1 |
| **I24** | A line the record grammar does not recognise is reported verbatim and never skipped. | `unit/script/read-designstate` | code | tools/Read-DesignState.Tests.ps1 |
| **I25** | Regeneration is idempotent and order-independent: twice produces identical bytes, and one region's regeneration never changes another's output. | `unit/script/update-designprojection` | code | tools/Update-DesignProjection.Tests.ps1 |
| **I26** | No pre-existing entry in `design/90-decisions.md` is ever modified. Commits to that file are additions only. | `unit/document/design-90-decisions` | instruction | — |
| **I27** | Every command and script this design touches degrades to today's behaviour when the state set is absent. | `unit/document/design-10-design` | instruction | — |
| **I28** | GitHub is the authority for a slice's acceptance criteria, completion and order. A `WorkRef` is a mirror, is stale by default, and is never cited as authority. | `unit/command/track` | instruction | — |
| **I29** | The projector never writes inside a declared region, and no id is both projected and declared. | `unit/script/update-designprojection` | code | tools/Update-DesignProjection.Tests.ps1 |
| **I30** | A record with `Status: retired` keeps its id resolvable, is excluded from every closure, and has its `Anchor` exempt from the tree check. Nothing else about it changes, and a live record naming it is not a finding. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1 |
| **I31** | A contract's `Owner` is the unique active unit whose `Exposes` names that contract. It is the only reverse edge written to a record, and it is written only because it is checked. | `unit/script/test-designstate` | code | tools/Test-DesignState.Tests.ps1 |
<!-- invariants:end -->

### Spec-set checker invariants

The highest-value section. Each is written so it could become an assertion. **Enforced-by-code**
means a test fails when it is broken; those are the only ones a reader may trust without checking.

| Id | Invariant | Owner | Enforcement |
|---|---|---|---|
| **SS1** | No module opens any path under the corpus for writing, and no parameter enables it | All | Code — AST inspection asserts no write cmdlet takes a corpus path, and no `-Fix`/`-Write`/`-Apply` parameter exists |
| **SS2** | Every regular expression in the system is in `Read-SpecSet.ps1` | Index | Code — AST inspection finds no match operator or `[regex]` outside that file |
| **SS3** | No check function reads a file | Checks | Code — AST inspection finds no file cmdlet inside any check function |
| **SS4** | No check calls another check | Checks | Code — a check receives records and returns findings; the call graph is asserted acyclic and flat |
| **SS5** | If any check records an *unchecked* entry, the run exits 2 regardless of findings. An *unresolvable* entry never changes run status | Report | Code — a fixture producing one of each asserts both directions |
| **SS6** | Every obligation, register row, concept, and reference is in exactly one of held, failed, unchecked, or unresolvable | Report | Code — the four counts sum to the index's totals |
| **SS7** | An unrecognised construct stops the run; nothing partial is reported as complete | Index | Code — the grammar's fallback branch raises, and a test feeds it an unknown form |
| **SS8** | Closure is derived from a declaration's form and can be set by nothing else | Index | Code — no marker id, parameter, or config key names closure |
| **SS9** | A cross-repository reference is reported unresolvable, never passed, never broken, and no parameter can change that | Checks | Code — asserted alongside SS1's no-write-parameter check |
| **SS10** | The report names the commit it ran against and whether the tree was clean | Report | Code |
| **SS11** | A finding states that two documents disagree and never which is stale | Checks | Instruction — `SpecFinding` has no field for it, which is the enforcement available |
| **SS12** | Every marker is an HTML comment; removing the checker leaves the corpus valid, publishable markdown | Corpus | Code — the docs build has no dependency on the checker, and a test asserts markers render nothing |
| **SS13** | Every register row has a non-empty `Reason` and a non-empty `Settles when` cell | Checks | Code |
| **SS14** | `04` §22.2 is the sole provisional register; every other list of provisional numbers is a pointer to it | Corpus | Code — exactly one `provisional-register` region corpus-wide |
| **SS15** | Only a closed declaration may carry a mirror obligation | Checks | Code |
| **SS16** | A clean run is never reported as "`03` and `04` are consistent" | Report | Instruction — the report states the obligation count checked, and the wording is fixed in `Write-SpecSetReport` |
| **SS17** | Every cross-repository claim pins a sha, in the `<path> § <section> @ <sha>` form `AGENTS.md` already uses | Corpus | Code |
| **SS18** | Every completed run names its unresolvable count, including a run reporting `Valid`, and no wording implies those subjects were checked | Report | Code — a fixture with a non-zero count asserts the count appears in the report under `Valid` |

**SS16 is the bound on what this machinery may claim, and it is the one an author is most likely to
forget.** The checker proves that declared obligations hold. It cannot prove the obligation set is
complete, because completeness is a reading and nothing can compute "describes". A report that
implied otherwise would be worse than no report at all: it would retire the full-audit read that
currently catches everything the extractor cannot see. Path 1 exists to retire the counting, not
the reading.

**SS18 is what keeps SS5's split from becoming the hole it looks like.** Letting an unresolvable
entry pass without failing the build is only defensible while the run says out loud what it did not
reach. Take SS18 away and `Valid` starts meaning two different things a reader cannot tell apart —
a corpus whose references all resolved, and one where eight of them were never looked at — which is
the *could not look read as nothing wrong* failure re-entering through the door SS5 just opened.
The exit code stops carrying that fact, so the report must.

**SS11's enforcement is deliberately weak, and the weakness is recorded rather than fixed.** No test
can tell whether a `Detail` string editorialises. Removing the field would make findings useless.
The structural mitigation is that `SpecFinding` carries no `Culprit`, `Stale`, or `Correct` field
for anyone to populate.

### Content path invariants

Hand-authored, like the SS rows above and for the same reason — the content path has no
`design/state/` records, per *Contract scopes*. **`Evidence` names the test or the gate that
fails when the row is broken**, and an em dash means nothing enforces it yet.

| Id | Invariant | Owner | Enforcement | Evidence |
|---|---|---|---|---|
| **CP1** | No source in this repository imports the engine by anything other than `@the-running-dev/game-engine` or its `/authoring` subpath, and no relative import escapes this repository's own sources | Campaign sources, Exporter | Code | `src/published-surface.test.ts` |
| **CP2** | `content/` has exactly one writer, and it writes nowhere else | Exporter | Code | `src/published-surface.test.ts` |
| **CP3** | Nothing in this repository reads a file under `content/` | All | Code | `src/published-surface.test.ts` |
| **CP4** | Every campaign builds and the whole set validates before any file is written; a failure before the write phase leaves `content/` byte-identical | Exporter | Code | — |
| **CP5** | Two exports from the same sources and the same pin produce byte-identical files | Exporter | Code | `.github/workflows/verify.yml`, step *Re-export content and fail if the committed JSON is stale* |
| **CP6** | Every `.json` under `content/` the publication catalog does not name is removed by the export | Exporter | Code | — |
| **CP7** | Every collection `SimulationCampaignSource` requires is present on every campaign source; an unwritten one is empty, never absent | Campaign sources | Code | `src/campaigns/stable-life.test.ts` |
| **CP8** | No file under `content/` is hand-edited | The author | Instruction — the next export overwriting it is the only consequence, and making it an error would forbid the catalog-owns-the-directory behaviour CP6 requires | — |
| **CP9** | No program in this repository resolves a `§` citation outside the corpus, and the spec-set checker keeps exactly one corpus root | Index, Campaign sources | Instruction — widening the root is a contract amendment, not a slice's call | — |
| **CP10** | Where the pinned engine cannot express a requirement the corpus states, the campaign omits it visibly and names the omission, and the gap is raised in the engine repository rather than worked around here | Campaign sources | Instruction — the brief's non-goal is the enforcement available | — |
| **CP11** | The clean check compares only `content/`, and no parameter widens or relaxes the comparison | Clean check | Code | — |
| **CP12** | The typecheck runs before the export in every composed invocation and in CI | `package.json`, workflow | Code | — |
| **CP13** | No content-path step exits 0 for a comparison or a build it could not make | All | Code | — |
| **CP14** | The engine pin moves only in a commit that also regenerates the export | The author | Instruction | — |
| **CP15** | No artifact under `content/` records provenance; the publishing commit and the gitlink it carries are the answer | Exporter | Code — the only files are campaigns and the manifest | — |

**A `Code` row whose `Evidence` cell is an em dash is a requirement this contract asserts and no
test yet enforces, and it may not be trusted without checking.** That is what the SS table's
header sentence has always meant, made visible per row rather than stated once — and the reason
it is made visible is `90-decisions.md` (2026-08-29, six SS invariants gain the tests their
Enforcement column already claimed), where six rows claimed `Code` while nothing enforced them.
**The precedent binds in the same direction it did there: the tests get written, and the claim
is not downgraded to match the tree.** The slices that land them own these cells, and a slice
that fills one fills it with a path, never with a description of a check it did not write.

**CP5 is the payment for committing derived output, and everything under `content/` rests on
it.** The rule that two copies of a fact will diverge is not suspended by this path; it is
bought off, and CP5 is the price. If the export ever becomes nondeterministic the committed JSON
stops being a cache and becomes a second source of truth checked by a coin flip — at which point
`90-decisions.md` (2026-08-30, ownership) has been reversed by accident rather than by decision.

**CP1 is the row the submodule makes easy to break, and it is the only one whose violation looks
like success.** A relative import into the engine's source tree typechecks, runs, and passes
every gate; it fails when the pin moves, or when someone tries to run this campaign on a
published engine version — which is to say, at the moment the content is supposed to be
portable. The packed-tarball boundary that enforces this in the engine repository does not exist
here, and `90-decisions.md` (2026-08-30, published surface) chose a test rather than prose or a
lint toolchain precisely because prose is what is already in place and is not working.

**CP10 has no mechanical enforcement and cannot acquire one here, and the same bound covers a
larger class.** No program in this repository compares a literal in `src/` to a number in
`docs/docs/games/`. The tests beside a campaign restate the same numbers, so they check the
transcription against itself — they are regression tests against a later edit, which is worth
having, and they are not fidelity checks against the corpus. **The content path makes the
corpus's type claims fail a build and leaves its numeric claims exactly where they were: on the
full-audit path.** That is the honest bound on the brief's claim that authoring makes the spec
set checkable, and it sits beside SS16's bound rather than under it.

**The value of this path as evidence is proportional to the content authored.** Fourteen of the
seed campaign's seventeen collections are empty, and every empty one is a region of the corpus
no compiler has yet been asked about. Nothing in this table changes as they fill; what changes
is how much the table is worth.

## Unresolved

Signatures and rules the design document does not determine. Each is a fork `10-design.md` §
*Open questions* states this document may not settle, and each is left open rather than
invented. **This section only ever shrinks.**

**1. Whether a change to a published campaign requires its version to change** — and therefore
whether a check exists at all, what it compares, and what its surface is. The candidate is a
comparison against the previous commit's manifest, which is cheap while there is one campaign
and no host fetching. This is a compatibility promise to an external consumer, so neither
`10-design.md` nor this document may make it; § *Open questions* 1 carries the recommendation.
Until it is answered, the three names a campaign has stand unreconciled and a host is told
nothing about which of them to trust.

**2. What condition lifts a campaign out of the hidden state its catalog card declares.** The
card's fitness fields have no contracted transition: nothing here says what makes a seed not a
seed, and no code may decide it while that is true. § *Open questions* 2 carries the
recommendation.

**3. Whether the second game's content is in scope for this repository.** The answer determines
whether the exporter's kind handling stays single-kind — today the kind registry is assembled by
a cast at both call sites, a shape this contract deliberately does not bless — and whether the
shared Bulgarian source scenes have a home in this tree. § *Open questions* 3 carries the
recommendation.
