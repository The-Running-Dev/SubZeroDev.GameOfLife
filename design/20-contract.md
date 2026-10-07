# Contract — Life in the Fast Lane repository

The spec-set path and the content path are both derived from [`10-design.md`](10-design.md), which
designs them as its two systems. Binding on every slice.

The systems contracted here are the **spec-set checker**, the **marker vocabulary** the corpus
carries for it, and the **content path** — the campaign sources, the exporter, the clean check, and
the pinned engine they are authored against. The corpus's own meaning — the game, the engine, the
numbers — is not this document's subject and is never constrained by it, and neither is a
campaign's content. **What the content path contracts is how content is built, published and
checked, never what it says.**

Spec-set invariant ids are prefixed `SS` and content-path ids `CP`. They are separate namespaces
and an id is never reused across them.

**Scaffold notice.** Declarations below marked *scaffold* exist here only until the slice that
materialises them lands. That slice replaces the block with a pointer to the declaring file in the
same commit, and what remains is the surrounding semantics. Nothing in this document may be read
as authorising a second copy of a declaration the tree carries.

## Contract scopes

This repository has two standing contract paths:

- The spec-set checker derived from design/10-design.md in this repository.
- The content path — the campaign sources, the exporter, the clean check, and the pinned
  engine — derived from design/10-design.md, system 2, in this repository.

A later contract run for either path preserves the other. No path may rewrite the file from a
blank document. Names prefixed SS belong to the spec-set path; names prefixed CP belong to the
content path.

## Types

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
not an obligation — `03` §12.1 names four of `RelationshipState`'s nine members, and §13.3's
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

**The `lifecycle-` vocabulary is reserved to the derived set, and a region naming anything else
is a finding** — SS15's rule one check over, and for the same reason. A stateless mechanism's
lifecycle is documented in ordinary prose, which is where the full-audit path reads it; a marked
region is how a *checked* obligation is declared, and one naming a subject no check can enumerate
declares nothing. What the reservation actually buys is the misspelling: `lifecycle-PlayerStat`
is otherwise an orphaned region that every check silently skips, on a document the report then
calls clean.

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

**No production source in this repository reads a file under `content/`** (CP3). The clean check reads git's
report about the directory, never its contents, and that distinction is what keeps the content
path from closing a loop through its own output.

## Persisted schemas

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
`if ($MyInvocation.InvocationName -ne '.')` so the Pester file can dot-source it — the usual structure
for a script with a Pester file, for the same reason.

The result object is a `[pscustomobject]` and not one of the classes above, because `/agentkit:verify`
consumes that shape. Its `State` is
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
- A `(document, id)` pair must be unique within the corpus.
- **Every region in the corpus is declared, and a projected marker anywhere in it is a finding.**
  The corpus has no projector — SS1 makes every module read-only — so a rendered region cannot
  legitimately appear here, and treating one as merely unrecognised is how an obligation
  disappears without trace: drop `:declared:` from both of a region's markers and the region
  ceases to exist, the obligation with it, on a run that still reports `Valid`.
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

**Where the pinned engine cannot express a requirement the corpus states, the source omits or
narrows it visibly and names what was left out** (CP10). Never approximate: an approximation is
a **silent** divergence between the campaign and the spec it was authored from, in the one
artifact whose entire purpose is to be evidence that the two agree.

**Silence is what the rule turns on, and a narrower condition is not silent when it says so.**
A condition over a real field the pinned engine resolves, named at its site as weaker than what
the corpus asks, is compliant; `90-decisions.md` (2026-08-31, a `.length` narrowing) settled that.
The line falls where a form can become wrong without anyone editing
it: `player.relationships.0.affinity` addresses one NPC by position and stops meaning what it
meant the moment the array reorders, which is a divergence nothing announces, so it is forbidden
even though it resolves. `player.relationships.length` names no item, so reordering cannot make
it wrong — it can only ever be weaker than the corpus's own per-item gate, which is the thing the
site must say out loud. **Omission remains the default and the narrowing is the exception**: it
is available only where the narrower condition is a real property of the same subject, never
where it is a different question standing in for the one the corpus asked.

#### `scripts/export-content.ts`

Declared in [`scripts/export-content.ts`](../scripts/export-content.ts). The `entries` list is
the publication catalog and is this file's most important surface.

**It is the only production writer in either system, and `content/` is the only directory the
invoked export writes** (CP2).

**It builds every campaign and validates the whole set before writing any file** (CP4), so an
authoring or validation failure leaves the directory byte-identical. That ordering is the
difference between a failed export and a half-published catalog the next consumer fetches.

**The serialization form is contracted, not a formatting preference.** Two-space indentation,
exactly one trailing newline, and the manifest written in catalog order. The clean check
compares bytes, and the diff is the only place a behavioural change in the engine becomes
visible to a person; minifying the output would remove the second of those and break the first.

**It removes every `.json` under `content/` the catalog does not name** (CP6). That is what
makes a retired or renamed campaign disappear rather than linger.

**No command-line parameter may make it write elsewhere or write a subset.** There is no
`--out-dir` and no `--only`, and adding either defeats CP4 and CP6 at once: a partial export is
indistinguishable from a stale one to the clean check, which is the only thing standing between a
source edit and a silently unpublished change.

**`exportContent` takes its catalog and its output directory as arguments, and the rule above
binds the invoked surface rather than that signature.** `main()` supplies the module's `entries`
and `outputDir`, and nothing else calls it in production, so what is published is what the rule
describes. The arguments are what lets the exporter's error table be exercised at all:
`CampaignDidNotBuild` and `ValidationRejected` need a catalog that fails, and `WriteFailed` needs
a filesystem that rejects a real write — which `90-decisions.md` (2026-09-01, `WriteFailed`) chose
over a stub, and which cannot be aimed at the published directory without publishing from it. The
scope carries the obligation the production-source scope on CP2 and CP3 already carries: **a test
that leaves `content/` differing from the committed export has failed, whatever else it
asserted**, which is why each one ends on a `git status` assertion. **What the evidence check
proves is correspondingly narrower than its name reads**: it resolves the exporter's writes to the
binding spelled `outputDir`, which inside `exportContent` is the argument and not the module
constant it checks separately.

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
| `MalformedRegion` | A marker is unclosed, mismatched, nested, or written in the projected form, which the corpus has no writer for | Fix the markers |
| `DuplicateRegionId` | A `(document, id)` repeats within the corpus | Rename one region |
| `CorpusNotFound` | `-CorpusPath` does not resolve to a directory | Fix the invocation |

**`MalformedRegion` covers the projected form as well as the unbalanced ones, and the name
reading narrower than what it checks is the price** — paid deliberately, for the third time in
this document, on the reasoning that widened `AnchorMissing` and `EnforcementUnevidenced` rather
than splitting them: the check, the remedy, and the reason are the same in every case, and a
second reason would have split one rule across two names for nothing.

**What this does not reach, stated rather than left to be found: an id declared in the corpus and
projected outside it.** `AGENTS.md` § *Marked regions* makes form consistency repository-wide and
`90-decisions.md` (2026-08-21, marked-region identity) settled it, but no checker applies it
across both roots. `IdCollision` enforces it over the design-state document set, which
§ *Artifacts of a unit kind* never resolves into `docs/docs/games/`; the spec-set checker cannot
reach the other direction either, because CP9 keeps it to exactly one corpus root and widening
that is a contract amendment rather than a slice's call. The exposure is small and worth naming:
the corpus's ids are `mirror-`, `provisional-`, `lifecycle-` prefixed and nothing outside it
projects under those names. The rule stands; what is checked is each root against itself.

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
| `concept` | A `lifecycle-` region names something outside the derived concept set |
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

**Status 2 takes precedence over 1** (SS5).

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
| **SS6** | Every obligation, register row, concept, and reference is counted in at least one of held, failed, unchecked, or unresolvable, and the only subject counted twice is a cross-repository reference that also carries a missing-pin finding | Report | Code — the four counts sum to the index's totals once that overlap is subtracted, asserted against the real corpus, which has none, and a fixture that has one |
| **SS7** | An unrecognised construct stops the run; nothing partial is reported as complete | Index | Code — the grammar's fallback branch raises, and a test feeds it an unknown form |
| **SS8** | Closure is derived from a declaration's form and can be set by nothing else | Index | Code — no marker id, parameter, or config key names closure |
| **SS9** | A cross-repository reference is reported unresolvable, never passed, never broken, and no parameter can change that | Checks | Code — asserted alongside SS1's no-write-parameter check |
| **SS10** | The result object names the commit it ran against and whether the tree was clean | Report | Code |
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

**SS6 counts one subject twice, and naming the overlap is what keeps the row checkable.** A
cross-repository reference missing its pinned sha is `Unresolvable` — its `Status` is always that,
never `Failed`, which is what SS9 turns on — while also carrying an SS17 finding about this
repository's own prose. The bucket counts report it in both places. The alternative considered and
rejected was to count it once by dropping it from `Failed`, which was a change to the code rather
than to this row; `90-decisions.md` (2026-09-01, SS6's overlap) records why the row moved instead,
and records the objection to it as known and retained. What stops the widening from emptying the
row is that the overlap is *closed*: exactly one shape produces it, so the sum is still an equality
once that shape is subtracted, and both sides of it are asserted — the real corpus, which has no
such reference, and a fixture that has one. A second overlap is a contract amendment, not a
counting detail.

**SS10 names the result object, not the printed line, and the two are different surfaces.** The
line `Write-SpecSetReport` emits carries the state, the document and declaration counts, the
obligation count (SS16) and the unresolvable count (SS18); it does not carry the commit or the
tree state, and it is not meant to. `-Quiet` suppresses that line and can never suppress the
object, so the object is the one surface always present — which is why it is where SS10's fact
belongs and where `S1.6` asserts it. This row once read "the report", the same word SS16 and SS18
use for the printed line, which made one word do two jobs.

### Content path invariants

Hand-authored, like the SS rows above. **`Evidence` names the test or the gate that
fails when the row is broken**, and an em dash means nothing enforces it yet.

| Id | Invariant | Owner | Enforcement | Evidence |
|---|---|---|---|---|
| **CP1** | No source in this repository imports the engine by anything other than `@the-running-dev/game-engine` or its `/authoring` subpath, and no relative import escapes this repository's own sources | Campaign sources, Exporter | Code | `src/published-surface.test.ts` |
| **CP2** | `content/` has exactly one production writer, and the invoked export writes nowhere else | Exporter | Code | `src/published-surface.test.ts` |
| **CP3** | No production source in this repository reads a file under `content/` | All | Code | `src/published-surface.test.ts` |
| **CP4** | Every campaign builds and the whole set validates before any file is written; a failure before the write phase leaves `content/` byte-identical | Exporter | Code | `src/export-content.test.ts` |
| **CP5** | Two exports from the same sources and the same pin produce byte-identical files | Exporter | Code | `.github/workflows/verify.yml`, step *Re-export content and fail if the committed JSON is stale* |
| **CP6** | Every `.json` under `content/` the publication catalog does not name is removed by the export | Exporter | Code | `src/export-content.test.ts` |
| **CP7** | Every collection `SimulationCampaignSource` requires is present on every campaign source; an unwritten one is empty, never absent | Campaign sources | Code | `src/campaigns/stable-life.test.ts` |
| **CP8** | No file under `content/` is hand-edited | The author | Instruction — the next export overwriting it is the only consequence, and making it an error would forbid the catalog-owns-the-directory behaviour CP6 requires | — |
| **CP9** | No program in this repository resolves a `§` citation outside the corpus, and the spec-set checker keeps exactly one corpus root | Index, Campaign sources | Instruction — widening the root is a contract amendment, not a slice's call | — |
| **CP10** | Where the pinned engine cannot express a requirement the corpus states, the campaign omits or narrows it visibly and names what was left out, and the gap is raised in the engine repository rather than worked around here | Campaign sources | Instruction — the brief's non-goal is the enforcement available | — |
| **CP11** | The clean check compares only `content/`, and no parameter widens or relaxes the comparison | Clean check | Code | `src/check-clean.test.ts` |
| **CP12** | The typecheck runs before the export in every composed invocation and in CI | `package.json`, workflow | Code | `src/check-clean.test.ts` |
| **CP13** | No content-path step exits 0 for a comparison or a build it could not make | All | Code | `src/check-clean.test.ts` |
| **CP14** | The engine pin moves only in a commit that also regenerates the export | The author | Instruction | — |
| **CP15** | No artifact under `content/` records provenance; the publishing commit and the gitlink it carries are the answer | Exporter | Code — the only files are campaigns and the manifest | `src/export-content.test.ts` |

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

**CP2 and CP3 are scoped to production sources, and the carve-out is the tests' own
fixture.** A test may write under `content/` to prove the exporter reclaims what the catalog
does not name, and may read a published file to perturb and restore it so `ExportStale` can
be shown firing against the directory the gate actually guards. Neither is a second
publisher: what CP2 and CP3 protect is the relationship between the sources and what a host
fetches, and a fixture that is restored before the suite ends has not changed it. The scope
was live in the tree before it was written here — `src/published-surface.test.ts` excluded
test files from CP2 with the reasoning in a comment, CP3 was left unscoped and was being
broken by `src/check-clean.test.ts`, and the CP3 check resolved targets too narrowly to
notice. **The obligation the scope carries in exchange: a test that leaves `content/`
differing from the committed export has failed, whatever else it asserted**, which is why
every such test ends on a `git status` assertion rather than on a cleanup it hopes ran.

**CP10 has no mechanical enforcement and cannot acquire one here, and the same bound covers a
larger class.** No program in this repository compares a literal in `src/` to a number in
`docs/docs/games/`. The tests beside a campaign restate the same numbers, so they check the
transcription against itself — they are regression tests against a later edit, which is worth
having, and they are not fidelity checks against the corpus. **The content path makes the
corpus's type claims fail a build and leaves its numeric claims exactly where they were: on the
full-audit path.** That is the honest bound on the brief's claim that authoring makes the spec
set checkable, and it sits beside SS16's bound rather than under it.

**The value of this path as evidence is proportional to the content authored.** Some of the
seed campaign's collections are empty (`stable-life.test.ts` names which), and every empty one
is a region of the corpus no compiler has yet been asked about. Nothing in this table changes as they fill; what changes
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
