# Design — Life in the Fast Lane

Derived from [`00-brief.md`](00-brief.md). This document designs **two systems**, and neither of
them is the game or the engine. The game's design is `docs/docs/games/03-game-design.md`; the
engine's is `04-engine-specification.md`.

1. **The spec-set checker** — the machinery that holds the corpus's invariants.
2. **The content path** — the campaign sources, the portable JSON published from them, and the
   pinned engine they are authored against.

The brief states two problems and says the second is downstream of the first. The spec set drifts
faster than it is read, because each defect class is "only discoverable by reading the whole set at
once" — that is what system 1 attacks. And a spec nothing is built from is not checkable — that is
what system 2 is for. They are not independent: the second is the first's evidence, because a
corpus with no consumer can only ever be checked against itself.

A rule whose only enforcement is an expensive full read is enforced at whatever rate full reads
actually happen, which the repository's own history shows is lower than the edit rate. That is the
whole design problem for system 1. System 2 has a narrower version of it, and the bound belongs at
the top rather than in a footnote: **compiling a campaign against the engine's types checks the
corpus's type claims and nothing else.** Numbers, prose, and intent are untouched by it. The brief
says authoring closes the checkability gap; it closes the half a compiler can see, and *Failure
modes* gives the other half its own entry.

The repository's third contract path — the installed AgentKit design-state mechanism — is designed
upstream in AgentKit and deliberately has no design document here. It appears in `20-contract.md`
and nowhere in this one; that asymmetry is recorded in `90-decisions.md` (2026-08-30, *The
game-content path enters `design/` through a design pass*), which is also why the content path does
have one.

## Data model

### System 1 — the corpus and the checker's records

The corpus is the only persisted state. Everything the checker knows is **derived on each run and
discarded**; nothing is cached, mirrored into a sidecar, or written back. That is the first and
most consequential decision here, and *Alternatives considered* §1 records what it rejected.

Records fall into two ownerships, and the split is the load-bearing part of the model.

#### Derived records — extracted, never authored

Recomputed from the markdown on every run. They have no independent existence, so they cannot
drift from the corpus by construction.

| Record | Identity | Extracted from | Notes |
|---|---|---|---|
| **Document** | Repo-relative path | The corpus directory | Ordering position comes from the numeric filename prefix; see *Failure modes* on renumbering |
| **Declaration** | Qualified name (`AttributeState.wisdom`) | TypeScript fences in `04` | Fields, type aliases, and union members each get their own identity. The population, and how much of it is closed, is whatever `Test-SpecSet.ps1` reports |
| **Closure** | — | The declaration's own form | A derived boolean, defined below. The single most important derived value in the model |
| **Reference** | Source document + target | `§N.N` spans and inter-document links | Section references, document links, and cross-repository references are counted separately; the checker reports each |
| **Finding** | Check id + subject | A check run | In-memory for the life of one run |

**Closure is what makes the mirror invariant tractable.** A declaration is *closed* when its
membership is fixed by the declaration itself — an interface with named fields, a string-literal
union, an enum. It is *open* when membership is supplied by content at load time — a keyed map or
record whose value type is a content definition.

The distinction is not academic; it is the difference between a defect and a false positive:

- `AttributeState` is closed — seven named fields. Prose in `03` that lists six of them is the
  `wisdom` defect the brief names.
- Skills are open — `04` holds a keyed map of skill definitions and names no skill. The twelve
  skills listed in `03` §3.5 are therefore **content targets, not a restatement**, and their
  divergence from any list in `04` is not drift.

A checker without this distinction reports `03` §3.5 as a defect on every run, and a register of
false positives is a register nobody reads. Closure is derived, never declared, because a hand-
maintained closed/open flag is exactly the second copy this design exists to avoid.

The open/closed line is also the seam between the two systems. An open registry's membership is
supplied by content, and *that content is now in this repository* — so a skill named in `03` §3.5
and absent from `src/campaigns/` is not spec drift, it is unwritten content. The two systems are
looking at one fact from opposite sides.

#### Authored records — declared in the prose

These carry judgement a parser cannot compute. Each lives **inside the document it describes**, as
a declared marked region in the sense `AGENTS.md` § *Marked regions* already defines — hand-
authored, never generated, checked for presence and well-formedness like any other region. No new
marker syntax is introduced, and no sidecar file is created.

| Record | Owner | Lifecycle | Answers |
|---|---|---|---|
| **Mirror obligation** | `03` | Added when `03` chooses to describe a closed declaration; removed when it stops | Which of `04`'s closed declarations `03` is on the hook for |
| **Provisional entry** | `04` § 22.2 | Added when a number is invented; removed when it is decided | The reason it is deferred and the condition that would settle it |
| **Provisional site** | Wherever the number lives | Created and retired with the number | Links the site back to its register row |
| **Concept** | The document that introduces it | Added at introduction; removed when the concept is | What creates it and what retires it |

**Authored records are persisted as prose and nowhere else.** They are markers in the markdown,
inert HTML comments that neither Docusaurus nor a reader renders. Delete the checker entirely and
the corpus remains valid, publishable, and readable — the dependency runs one way only.

#### Why the mirror obligation is authored rather than inferred

The brief's second condition is conditional: every declaration in `04` *that `03` describes in
prose* must be consistent in both. Nothing can compute "describes". Prose that mentions an
identifier may be describing it, contrasting it, or naming it in passing, and the three are
indistinguishable to a parser but obvious to a reader.

So the obligation is declared, and the check becomes set arithmetic over ids rather than judgement
over sentences — the same move the repository already makes for acceptance criteria, which are
"compared on ids, never prose". Reworded prose is not drift. An added, removed, or renamed field
on an obligated declaration is.

This bounds what the machinery can honestly claim, and the bound belongs in the design rather than
in a footnote: **the checker proves that declared obligations hold. It cannot prove the obligation
set is complete.** Completeness of that set is a reading, and it is `/redteam`'s and the full-audit
path's job, not the extractor's. A checker that implied otherwise would be worse than none, because
it would retire the full read that currently catches what it cannot.

#### The precedent already in the corpus

`03` §3.4 is the model, and it was not designed here — it is what the repository already did. It
once carried the attribute list and drifted from it. It now states only the rule attributes obey
and holds no list at all; `04` holds the shape. The duplication was removed rather than
synchronised, and the defect class went with it.

§3.5, three lines below it, still carries its list. The difference is not inconsistency: skills are
open and attributes are closed, so §3.5's list is content and §3.4's list was a second copy. The
corpus is already right on both counts. The design's job is to make that distinction checkable
instead of incidental.

### System 2 — the content path

The same authored/derived split, and the same question asked of every record: could a reader
recover this by reading something else? The answer comes out differently here, and the difference
is the most important thing in this section.

#### Authored records

| Record | Identity | Owner | Lifecycle |
|---|---|---|---|
| **Campaign source** | Campaign id | `src/campaigns/` | Created when a scenario is authored against `03` §16; retired by removal from the publication catalog and then from the tree |
| **Catalog card** | Its campaign | The campaign source | Created and retired with the source. Carries what a host shows a player *before* loading — including whether the campaign is fit to be seen at all |
| **Publication catalog** | The exporter's ordered entry list | The exporter | The boundary between *exists in the tree* and *is published*. A source absent from it is unpublished however finished it looks |
| **Engine pin** | The submodule commit | `.gitmodules` and the recorded commit | Moved deliberately, never incidentally — *Control flow* path 5 |

#### Derived records

| Record | Derived from | Persisted? |
|---|---|---|
| **Built campaign** | A campaign source, through the engine's builder | No — in memory for the life of one export or one test |
| **String table** | The LocKeys the source authors, lifted by the builder | No, except as part of the portable form |
| **Portable campaign JSON** | A built campaign plus its catalog card | **Yes, and committed** |
| **Manifest** | The exported set | **Yes, and committed** |
| **Digests** | The portable form, and the (id, version) pairs | Yes, inside the manifest |

**Everything under `content/` is derived, and it is committed anyway.** That is the exact opposite
of system 1's central decision, in the same repository, and the two are reconcilable on one
property rather than on taste.

The corpus sidecar was rejected because extracting declarations from prose is lossy and
judgement-bearing: a sidecar could never be *fully* regenerated, so it would inevitably become an
independent authority, and eventually a stale one. The portable JSON is regenerated in full, from
its source, by a deterministic program, on every run. Nothing in it is authored and nothing in it
survives a re-export. A second copy that can be recomputed exactly is not a second source of truth
— it is a cache, and a cache with a gate that rebuilds and compares it on every run cannot be stale
for longer than one commit.

So the rule the repository states as "two copies is a promise they will diverge" is not suspended
here; it is paid for. The clean check is the payment, and *Failure modes* is where the cost of a
missed payment is written down. The reason for committing at all is that a host fetches files
rather than running a build — the brief's own definition of done says so — and the reason the files
are written to be read rather than minified is that the diff is the only place a behavioural change
in the engine becomes visible to a person.

#### Identity, and the one place it is ambiguous

A campaign has two identities and they answer different questions. `(id, version)` is what a host
addresses and caches by. The digest is what the content actually is. They can disagree: editing a
campaign source without changing its version produces a new digest under an unchanged address, and
the manifest's resolution digest — computed over (id, version) pairs — does not move either. A host
that caches on the address serves the old campaign and has no way to know.

Nothing in the tree prevents that today. It is not a defect to fix by inference, because whether a
version bump is required on every content change is a compatibility promise this document may not
make on its own. See *Open questions* 1.

#### What the seed carries, and what makes it a seed

`src/campaigns/` holds one campaign today and it is deliberately not the game: the map and the
scenario are authored, and most of its collections are present and empty. Empty rather than absent
is a data-model decision worth keeping — an empty collection is an honest statement that the
content is unwritten, where an absent one would be indistinguishable from a source that got the
shape wrong. The catalog card says the same thing to a player, and hides the campaign while it is
true.

**The value of system 2 as evidence for system 1 is proportional to the content authored.** Every
empty collection is a region of `03` and `04` that no compiler has yet been asked about. That is
the honest shape of the brief's second problem: it is not solved by the path existing, it is solved
progressively as `03` §16.1's targets are met.

## Module boundaries

### System 1

Five modules. The dependency arrow points one way and the graph is acyclic.

```text
Corpus  ←  Index  ←  Checks  ←  Report  ←  Runner
```

**Corpus** — `docs/docs/games/`. Owns meaning: every type, number, concept, and sentence. Depends
on nothing. Knows nothing about the checker; its markers are comments, valid markdown with or
without a reader. Exposes: the markdown, and the published site built from it.

**Index** — extraction. Owns the derivation of declarations, closure, and references from prose.
Depends on the corpus, read-only. Exposes a record set. It contains every regular expression in the
system; no check ever sees raw text. That containment is deliberate — it makes the fragile part one
module with one failure mode, rather than a property smeared across four checks.

**Checks** — one per invariant, plus reference resolution. Depend on the index only, never on the
files. Each is independent of the others and none may call another; a check that needed another
check's finding would be a rule about two invariants, which belongs in the design rather than in
code. Exposes findings.

**Report** — rendering and exit status. Depends on findings. Owns the 0/1/2 status convention and
the separation of *found a problem* from *could not look*.

**Runner** — composition and the command-line surface. Depends on all of the above. Owns nothing
of its own.

**Read-only is a boundary, not a default.** No module writes to the corpus, and no module may gain
that power later. The repository's existing corpus-adjacent tooling is read-only by contract for a
stated reason, and the stronger reason applies here: a checker that could fix what it finds is a
generator, and a generative pass over the design documents is precisely the loop
`AGENTS.md` § *The design freeze* exists to escape. Checking must be a fixed point. Fixing is a
person's decision and an editing command's job.

### System 2

Three modules of its own, and one external dependency that is the whole point of the boundary.

```text
Corpus  ⇠ cited by ⇠  Campaign sources  ←  Exporter  →  content/  ←  Clean check
                             ↓                 ↓
                       Engine (published surfaces only)
```

**Campaign sources** — own the game's content as data, and own the transcription from `03` §16 into
it. Depend on the engine's published authoring surface for the shapes they fill in, and on the
corpus for meaning. Expose a source object and a build function per campaign.

**Exporter** — owns the publication catalog, the serialization form, the determinism obligations,
and the retirement of files the catalog no longer names. Depends on the campaign sources and on
both published engine surfaces. Exposes the files under `content/`. It is the only writer in either
system, and its only write target is `content/`.

**Clean check** — owns the staleness comparison and nothing else. Depends on git and on `content/`.
Exposes an exit status. Deliberately scoped to `content/`, because an unrelated dirty tree is the
author's business and not a gate's.

**Engine** — external, and consumed through exactly two specifiers: `@the-running-dev/game-engine`
for the runtime types a host compiles against, and its `/authoring` subpath for the builders and
source types. **Nothing in this repository may reach past those two.** That is what makes this
repository a consumer rather than a fork, and it is the difference between a campaign a published
engine version can run and one only this working tree can.

The boundary has a hazard the engine repository does not have. There, the surface is enforced by
packing a tarball: what is not exported cannot be imported, because it is not there. Here the
submodule puts the engine's entire source tree inside this working tree, a relative path away from
every campaign source, and the package's export map is bypassed the moment an import is written as
a path rather than as a package name. The boundary is real, it is load-bearing, and today only
prose guards it. *Alternatives considered* §7 settles that.

**The citation edge is not a dependency.** Campaign sources cite the corpus by section number in
comments; nothing imports it, reads it, or fails when it moves. That direction is drawn with a
different arrow above because it is the one edge in either system that no program traverses — and
therefore the one edge that can rot in silence. *Alternatives considered* §9.

### The combined graph

Acyclic, and the property worth checking is that the two systems do not close a loop through the
corpus. System 1 reads the corpus and writes nothing. System 2 reads the engine and writes only
`content/`. Neither reads the other's output, and nothing inside this repository reads `content/`
at all. The one edge that would create a cycle — the checker reading `src/` to validate its
citations, making the corpus's checker depend on the corpus's consumer — is rejected in
*Alternatives considered* §9, for that reason among others.

### External boundaries

Five, and each is a place this repository's guarantees stop.

- **Docusaurus and the base image.** Consumes the corpus, one way. Decoupled from the checker
  entirely: the check runs without Docker, and the site builds without the checker. `agent.md`
  records the base image's contents as assumed rather than verified, which is why nothing here
  depends on it.
- **SubZeroDev.GameEngine, as a reader of the corpus.** The consumer of the spec set, and the only
  judge of the brief's first condition. The corpus names it; it cannot be read from here without a
  checkout.
- **SubZeroDev.GameEngine, as a pinned dependency.** A different relationship with the same
  repository, and keeping the two distinct matters: system 1 may not read it at all, while system 2
  compiles against one commit of it. A statement here about the engine's *contracts* is
  unverifiable from here; a statement here about the engine's *types* is verified on every build,
  against that commit.
- **A host.** Fetches `content/`. Never reads the specs, never builds anything, and is the only
  audience for the published JSON. Its contract with this repository is the manifest and the
  digests, which is why *Open questions* 1 is a question rather than a preference.
- **GitHub.** Tracking, and CI. No invariant's *meaning* depends on it.

## Control flow

Six paths, at six different rates. The design's purpose in both systems is to move work from the
slowest to the fastest.

### 1. Edit-and-check — triggered by an author changing a document

The common path, many times a session. An edit lands; the check runs over the whole corpus, not the
diff; findings print; the author resolves or accepts them before committing. Whole-corpus every
time because the defect class is *cross-document* — an edit to `04` breaks an obligation held in
`03`, and a diff-scoped check would look at exactly the wrong file. The corpus is small enough that
scope is not worth buying.

### 2. Full audit — triggered deliberately, at phase boundaries

The expensive read the brief says does not happen often enough. A person or a session reads the set
as a whole and judges what the checker cannot: whether the obligation set is complete, whether a
lifecycle statement is true rather than merely present, whether a settling condition is real,
whether a number transcribed into a campaign source is the number the corpus states.

This path is **not** replaced by paths 1 and 4, and the design fails if it is treated as replaced.
Those paths retire the mechanical half — the counting and set arithmetic that `AGENTS.md`
classifies as work that should leave the model entirely — so that the full read spends its
attention on meaning. The `wisdom` defect was findable by counting. Whether `03` §3.4's remaining
rule is the *right* rule was never findable that way.

### 3. Downstream question — triggered by GameEngine failing to implement

The outer loop for system 1, and the brief's first condition: the engine repository implements the
first playable scope and either does so without a clarifying question or does not. The brief
settles how this is judged — "by attempting it, not by review" — so the trigger is an
implementation attempt, and the signal is a question that could not be answered from the documents.

Each such question is a defect in the corpus, regardless of how reasonable it was to ask. It
returns as a tracker issue and is fixed here. This is the only path that can detect meaning that is
absent rather than inconsistent, and no amount of local checking substitutes for it.

### 4. Author-and-export — triggered by an author changing a campaign source

System 2's common path. Typecheck, then test, then export, then compare the export against what is
committed. The ordering is load-bearing and has its own note in *Concurrency and ordering* — unlike
system 1's checks, these steps are not interchangeable.

Whole-catalog every time, for the same reason system 1 is whole-corpus: a shared engine surface
means one source's edit can change another's output, and the manifest is a function of the entire
set.

### 5. Pin move — triggered by needing a fix or a surface the pinned engine does not have

Rare, and deliberate. The pin moves, the engine is rebuilt from the new commit, and the export is
regenerated in the same commit. Three outcomes, and the design's job is that all three are visible:

- **The surface shrank or changed shape.** The typecheck fails, before anything is written. This is
  the intended detector, and the reason the pin is a commit rather than a version range.
- **Behaviour changed without the surface changing.** Everything compiles, the export produces
  different JSON, and the diff is the only evidence there is. This is why the export is regenerated
  in the same commit rather than later, and why the JSON is written to be read.
- **Nothing changed.** The export is byte-identical and the commit carries only the pin.

A pin move that skips the re-export is caught by the clean check on the next run of anything — but
it is caught as *someone forgot to export*, one commit later, with the pin move no longer in the
diff being reviewed. Landing them together is what keeps the cause and the effect in one place.

### 6. Authoring discovers an engine gap — triggered by a spec requirement the surface cannot express

The outer loop for system 2, and the sibling of path 3. Path 3 detects meaning missing from the
corpus; this detects capability missing from the engine. It has already fired once: a completion
requirement in `03` §16.3 needs a condition over a collection, and the condition language
implements only scalar fields.

The response is fixed by the brief's non-goals and is not a judgement call: the gap is raised in
the engine repository and **never worked around here**. The campaign visibly omits what it cannot
express, and says so at the omission, rather than approximating it. An approximation would be a
silent divergence between the campaign and the spec it was authored from, in the one artifact whose
entire purpose is to be evidence that the two agree.

## Failure modes

### System 1

#### The index cannot parse something

A TypeScript fence the restricted grammar does not accept, a marked region that is unclosed or
mismatched, or a document that is unreadable.

**The extractor fails loudly and never guesses.** This is the decision that makes a restricted
parser safe to rely on: the danger in pattern-matching a language is not that it fails, it is that
it silently matches less than it should and reports the shortfall as a clean run. A declaration the
index skipped is a declaration no check examined, and the report would say the corpus is clean.

Detected at extraction. The run stops, reports the file and line, exits 2. The author sees which
construct was not understood. State left behind: none. Nothing partial is reported as complete.

#### A check finds a genuine defect

An obligated declaration whose fields `03` no longer mirrors; a provisional entry missing its
reason or its settling condition; a provisional site whose register row does not exist, or a row no
site points at; a concept with no lifecycle; a reference resolving to nothing.

Reported as a finding, exit 1. Which side is wrong is not the checker's call — an unmirrored pair
means `03` and `04` disagree, and either could be the stale one. The check establishes that they
disagree and stops there, per the repository's standing rule that drift is reported and neither
side changed.

#### Partial failure — some checks ran, one could not

**Status 2 takes precedence over 1**, following the convention the repository's existing tooling
already sets. A run that found drift *and* failed to complete a comparison is an incomplete run,
and reporting it as a finished one is the fabricated-gate-result failure the repository's
*Verification* rules exist to prevent. The report names what did not run, always, and that list is
the part that matters.

#### A cross-repository reference cannot be resolved

The corpus names engine documents that live in SubZeroDev.GameEngine. Without a checkout beside
this repository, those references cannot be resolved.

**They are reported as unresolvable, never as passed, and never as broken.** Absent evidence is not
evidence of either. An unresolvable reference is counted and named on every run and never changes
run status; an *unchecked* run — degraded, environmental, fixable — still forces status 2. The two
were one word until `90-decisions.md` (2026-08-23) split them, and the split is what stops a
permanent, recorded limitation from making the gate permanently red.

#### Docker or the base image is unavailable

The site does not build. The checker is unaffected, by the decoupling above. No invariant in the
brief depends on the site rendering, and the failure is visible immediately and locally.

#### A document is renumbered or inserted

The corpus's ordering is positional, so an insertion renumbers every later document and invalidates
every link and section reference into them. `agent.md` records this and advises appending.

The reference check detects the aftermath — dangling links and unresolvable section references —
but detects it *after* the renumbering, as breakage. It cannot make the operation safe, only loud.
That is a real and accepted limitation: a rename-aware migration would need the checker to write to
the corpus, which the module boundaries forbid for a stronger reason than this one is worth.

**Renumbering now breaks something the checker cannot see.** Campaign sources cite `03` by section
number, and those citations are comments in a tree the checker does not read. A renumbering that
the reference check reports cleanly, because every corpus-internal link was updated with it, can
leave every citation in `src/campaigns/` pointing at the wrong section. Detected only by the
full-audit path. *Alternatives considered* §9.

### System 2

#### The submodule is absent, uninitialised, or its commit is unreachable

Dependency resolution fails at the first command; the engine cannot be built and nothing imports.
Loud, immediate, and impossible to mistake for success, because no step of the content path can run
at all. This is the intended behaviour of a filesystem dependency on a submodule path, and it is
why the CI job checks out recursively.

#### The pinned engine's surface changes under sources already written

Detected by the typecheck, before the exporter runs, with no state left behind. This is the failure
this design most wants to be loud, because it is the one that would otherwise produce a *published*
artifact built from a surface its source no longer matches.

One ordering caveat is real, and it is a property to know rather than a defect to patch: the export
transpiles rather than typechecks, so **an export invoked on its own can publish from sources that
do not typecheck.** The composed check runs the typecheck first, and CI runs it as its own step.
See *Concurrency and ordering*.

#### The export is not deterministic

The gate compares a fresh export against the committed one, so any nondeterminism — unordered
iteration, a timestamp, an absolute path, a digest over an unstable ordering — turns the gate into
a coin flip that fails on commits that changed nothing.

Detected immediately and unmistakably: red on a no-op. The response is that it is a defect in the
exporter or in the engine, and never a reason to relax the comparison. A gate that is sometimes
wrong is worse than no gate, because the habit it trains is re-running it.

#### The campaign does not build, or validation rejects it

Every campaign is built and the whole set validated **before any file is written**, so an authoring
failure leaves `content/` byte-identical. The report is the engine's own errors. This ordering is
the difference between a failed export and a half-published catalog that the next consumer fetches.

#### The export crashes part-way through writing

The only partial-failure window in either system. Builds and validation are complete by then, so
what is left is a `content/` where some files are new and some are old — internally inconsistent,
with a manifest that may not describe what sits beside it.

Detection: the next clean check reports it. Recovery: discard the working tree's changes under
`content/`, which restores the last committed export exactly. **That recovery exists only because
the derived output is tracked in git** — the second reason for committing it, after the host, and
one that would not survive a decision to build on demand.

#### The committed export is stale

Someone edited a campaign source and did not re-export. This is the one failure a
published-content repository cannot detect by reading itself, because the source and the output are
each internally consistent and only their relationship is wrong. It is the brief's own drift class,
reappearing in the half of the repository that is code — which is why the gate for it is the
brief's own line about `content/` matching the sources on every run.

Detected by the clean check, on every run, in CI and locally. Response: fail, and name the files
that differ. Nothing is auto-committed; the fix is the author's re-export.

#### `content/` is hand-edited

An edit to a generated file survives until the next export and is then silently overwritten, and a
*new* file placed there is deleted by the next export, because the catalog owns which files exist.
Neither is detected as an error, and neither should be: the rule is that `content/` is never
hand-edited, and the export enforcing its own catalog is what makes a retired campaign actually
disappear instead of lingering as a document a host still fetches.

#### A number is transcribed from the corpus into a campaign source incorrectly

**Detected by nothing mechanical, and this is the bound on the brief's claim.** The tests around a
campaign source restate the same numbers, so they check the transcription against itself; they are
regression tests against a later edit, which is worth having, and they are not fidelity checks
against `03`. No program in this repository compares a literal in `src/` to a number in the corpus,
and the mirror machinery cannot be pointed at it either, because a mirror obligation is a claim
about two prose sites in one corpus.

The honest statement, which belongs in the design rather than being discovered later: the content
path makes the corpus's **type** claims fail a build, and leaves its **numeric** claims to the
full-audit path exactly as before.

#### A published campaign changes without its address changing

Described under *Data model* → *Identity*. Undetected, by construction, and the subject of
*Open questions* 1 rather than of a rule invented here.

### Retry semantics

None, anywhere, in either system. Every path is a local, deterministic pass over files on disk. The
single writer writes one directory whose contents are tracked, regenerable in full, and discardable
with a git restore. There is nothing to retry, no partial write that cannot be thrown away, and no
run that leaves state a later run must reconcile.

### The network

Needed to clone the submodule and install dependencies, and for nothing else. Both gates run
offline once that is done. A network failure during setup fails before any work begins; there is no
path on which a network failure produces a wrong answer rather than no answer.

## Concurrency and ordering

**Nothing in either system is concurrent.**

What enforces it: the repository has a single author and no runtime, no server, and no process that
outlives a command. Both gates are batch passes over files on disk. There is no scheduling to get
wrong because there is nothing to schedule.

**System 1's checks are order-independent; system 2's steps are not.** The distinction is worth
stating because the two look alike from outside. The checks depend only on the index and never on
each other, so they may run in any order and the report is a pure function of the record set.
System 2's steps form a strict sequence, and each ordering constraint has a reason that would be
lost if the steps were treated as a set:

- **Typecheck before export**, because the export transpiles rather than typechecks, and an export
  run first would publish from sources that do not compile.
- **Export before clean check**, because the clean check compares the working tree against what is
  committed, and has nothing to compare until the export has run.
- **Build and validate every campaign before writing any file**, because the alternative is a
  partially published catalog.

Three ordering hazards survive that, and none of them is concurrency in the runtime sense. All
three are real.

**The working tree moves under the run.** A check runs against whatever is on disk, which during an
editing session is a mixture of saved and unsaved state. A finding from such a run describes a
corpus that may never have been committed. Enforcement: the report **names the commit it ran
against and whether the tree was clean**. A run against a dirty tree is a useful local signal and
is not an authoritative result, and the report must be able to tell the two apart rather than
leaving the author to remember which it was.

**The two repositories advance independently.** This corpus and SubZeroDev.GameEngine have separate
histories, no shared lock, and each references the other. A statement here about the engine's
contracts is true as of some commit of a repository this one does not contain, and it can be
falsified by a push nobody here observes.

Nothing can prevent that, and the design does not pretend to. What it does is make a claim
checkable rather than merely asserted: a cross-repository reference **pins the commit it was true
at**, following the pinning convention this repository already uses for design references. An
unpinned cross-repository claim is unfalsifiable, and unfalsifiable claims in a specification are
how the engine ends up implementing against something that stopped being true.

**The content path is the same hazard with a lock on it, and the lock is one-directional.** The
submodule pin is that pinning convention applied to code rather than to prose, and it is stronger:
a prose pin records what was true, while the submodule pin *determines* what is built. But it locks
only this side. It says which engine this content was authored against; it says nothing about which
engine a host will run it on, and there is no mechanism here that could. The published artifact's
compatibility with a future engine version is the engine's contract to keep, not this repository's,
and stating that plainly is better than a version field that would imply otherwise.

## Alternatives considered

### 1. A machine-readable sidecar, rejected for extraction from prose

**Chosen:** derive every mechanical record from the markdown on each run; persist nothing.

**Rejected:** a sidecar file — YAML or JSON — enumerating the corpus's types, fields, and
provisional numbers for the checker to read.

The sidecar is easier to parse, needs no restricted grammar, and would make every check trivial.
It is rejected because it is a second copy of `04`'s declarations, and this repository's governing
rule on that is unambiguous: two copies of a fact is a promise they will diverge and a guarantee
nobody notices which is stale. A sidecar drifting from the prose would be a new instance of exactly
the defect class the brief is about — and worse than the existing one, because the checker would
report the corpus clean *from the stale copy* while the prose said something else. The tool would
become the most confident source of wrong answers in the repository.

The cost of the rejection is real: extraction needs a parser, and that parser is fragile. It is
paid by failing loudly rather than partially, above.

**Reversibility: expensive.** A sidecar, once written, becomes an input everything else assumes.

### 2. Extraction fragility handled by failing loudly, rejected for a full TypeScript parser

**Chosen:** a restricted grammar that accepts the declaration forms the corpus actually uses, and
exits 2 on anything else.

**Rejected:** parsing `04`'s fences with the real TypeScript compiler, via a Node toolchain.

A real parser is unambiguously more correct — closure in particular is a syntactic property it
would decide exactly, where a restricted grammar decides it for the forms it knows. The rejection
was not on correctness but on cost of ownership: it introduced a Node runtime and a package tree
into a repository whose entire toolchain was PowerShell Core, and that is a standing cost — a
version to maintain, a lockfile to audit, and an install step between an author and a check.

**Half of that reasoning has been overtaken by events, and the decision still stands.** The content
path brought Node, TypeScript and a lockfile into this repository for reasons that have nothing to
do with the checker, so the cost the rejection priced is now sunk. What is left is the argument
that actually decided it: the restricted grammar's failure mode is *acceptable because it was
designed to be*. It never guesses; an unrecognised construct stops the run, so the coverage gap is
visible, loud, and located. A parser that fails safely and covers most of the corpus is worth more
than one that covers all of it, and that comparison never depended on the runtime.

What changed is the price of reversing, not the choice. Crossing to a real parser is now much
cheaper than it was, so the reversal condition is easier to act on when it fires. The condition
itself is unchanged and still countable rather than a matter of taste: if the corpus's declaration
forms outgrow the grammar often enough that status 2 stops meaning "look at this" and starts
meaning "run it again", the tradeoff has inverted.

**Reversibility: cheap, and cheaper than when this was decided.** The index is one module behind a
record-set boundary, and a Node toolchain is now present regardless.

### 3. Declared mirror obligations, rejected for inferred ones

**Chosen:** `03` names the closed declarations it holds prose for; the check is set arithmetic over
those ids.

**Rejected:** inferring the obligation by scanning `03` for identifier mentions, so nothing needs
authoring.

Inference needs no markers and covers the corpus from the first run, which is genuinely attractive.
It is rejected because "mentions" and "describes" are different relations and only the second is
the brief's condition. Inference would flag `03` §3.5's twelve skills forever — they are content
against an open registry and correct as they stand — while a passing mention of a type in an
unrelated sentence would create an obligation nobody intended. The result is a report whose
findings are mostly wrong, and a report that is mostly wrong is not read, which returns the corpus
to its current state with an extra script in the way.

The cost is that obligations must be authored, and an unauthored one is invisible. That cost is
stated rather than mitigated, in *Data model*: the checker proves declared obligations hold and
cannot prove the set is complete. Naming that limit is what keeps the full-audit path alive.

**Reversibility: cheap.** Markers are additive and inert; abandoning them costs a deletion pass.

### 4. Reduce the mirrored surface, rejected for mirroring everything

**Chosen:** treat `03` §3.4 as the pattern. Where `03` restates a closed declaration's shape,
prefer deleting the restatement and keeping the rule; obligate and check what genuinely must be
described in both.

**Rejected:** obligating every closed declaration `03` mentions, and holding all of them
consistent.

Full mirroring is the literal maximal reading of the brief's second condition and needs no
judgement about what to keep. It is rejected because it maximises the surface that can drift in
order to check it, which is backwards: the pair that cannot diverge is the one that exists once.
The corpus has already run this experiment and won it — §3.4 carried the attribute list, drifted
from it, and now carries the rule instead. Nothing about attributes can go stale in `03` any more,
because `03` no longer says anything about attributes that `04` also says.

The counter-argument is real and is why this is not a pure single-ownership design: `03` is a
design document written to be *read*, and prose that refuses to name anything concrete is unusable
as design. So the mirror is reduced, not eliminated, and what remains of it is obligated and
checked.

**Reversibility: expensive.** Deleting prose from `03` and reconstructing it later is a rewrite,
and the deleted version is only in history.

### 5. A verification gate, rejected for a pre-commit hook and for CI

**Chosen:** the check is a gate the repository's verification command discovers and runs, invoked
deliberately.

**Rejected — pre-commit hook:** it would run at exactly the right moment, and it is rejected
because a hook that blocks a commit on a cross-document invariant blocks work-in-progress commits
that are legitimately mid-edit. A corpus-wide invariant is not a property every commit should have.
The predictable outcome is a habit of bypassing the hook, which is worse than not having one.

**Rejected — CI:** at the time this was written the repository had no CI at all, so CI would have
introduced a workflow, a runner, and a green/red signal as a side effect of a checker decision.
Whether this repository has CI is a policy question that outranks this design, so it was raised in
*Settled questions* 2 rather than settled by implication.

**Answered, and the premise above was wrong.** `90-decisions.md` (2026-08-20, *The checker is a CI
gate, and a finding fails the build*) found that `/verify` discovers a gate only from a
`# verification: true` comment in `.github/workflows/*.yml`, so with no workflow the checker was
never a discovered gate — the *Chosen* line was aspirational rather than true. The verification
workflow now carries it, and exit 1 and exit 2 both fail the step. The content path's gate was
added to the same workflow under the same convention, for the same reason. The pre-commit hook
stays rejected, unchanged.

**Reversibility: cheap** in both directions; the check is a command, and what invokes it is a
separate choice.

### 6. A committed export checked by regeneration, rejected for building on demand

**Chosen, and already decided** — `90-decisions.md` (2026-08-30, *Life in the Fast Lane's campaign
content is owned in this repository*) adopted the build-then-export shape with committed JSON and a
clean-check gate. It is restated here because *Data model* rests on it, and because a reader will
otherwise ask why one system in this repository refuses a derived copy while the other commits one.

**Rejected — build on demand, publishing nothing.** A host would have to run this repository's
toolchain, which makes the engine pin, Node, and the submodule a host's problem instead of this
repository's. The brief's definition of done says a host fetches the JSON.

**Rejected — commit the export and check it by asserting its digests in a test.** Cheaper to run,
and it does catch an unintended change, but it catches it as *a hash moved* rather than as a diff a
person can read, and it requires updating an expected hash on every intended change — which is a
second copy of the output's identity, hand-maintained, and therefore the very thing §1 rejects.
Regenerating and comparing is the same check with the evidence attached.

**Reversibility: moderate.** Stopping publication is a deletion; a host that has started fetching
turns it into a coordination problem rather than a repository decision.

### 7. The published surface is enforced by a check, rejected for prose alone

**Chosen:** a test on the existing content suite asserts that nothing in this repository's sources
imports the engine by anything other than its two published specifiers, and that no relative import
escapes this repository's own sources.

**Rejected — the rule stated in `AGENTS.md` and nowhere else.** This is the status quo. It is
rejected because the submodule makes the violation *easier* than the compliant form: the engine's
internals are a relative path away, they typecheck, they run, and they would keep working right up
until the pin moved or someone tried to run this campaign on a published engine version. The
repository has already decided how it feels about an unenforced rule — `90-decisions.md`
(2026-08-29, *Six SS invariants gain the tests their Enforcement column already claimed*) took six
contract rows that were true but unguarded and wrote the tests rather than downgrading the claim.
This is the same shape, reached before the violation rather than after.

**Rejected — an ESLint configuration with a restricted-import rule.** The idiomatic answer, and
what the engine repository does. Rejected because it buys a lint toolchain, its plugin tree and its
own configuration surface for a single rule, in a repository whose content gate is four commands
long — a new dependency in the sense that requires a logged decision, for something a test can
assert directly against files it is already reading.

**Rejected — consuming a packed tarball instead of the submodule source.** This reproduces the
engine repository's own boundary exactly and is the most honest form of the constraint. It is
rejected as *not currently available*: the surface this content is authored against exists in no
published version, which is why the submodule was chosen in the first place. It becomes the right
answer the moment the engine publishes a version carrying that surface, and the check chosen here
is what keeps the sources honest until then.

**Reversibility: cheap.** One test.

### 8. Provenance stays in git, rejected for a provenance field or file

**Chosen:** which engine produced a published artifact is answered by the commit that published it
and the submodule pin recorded in that commit. The artifact itself says nothing about it.

**Rejected — a sidecar provenance file beside the JSON**, naming the engine commit and the export
time. Rejected because it is a maintained second copy of a fact git already holds exactly, it would
be the only file under `content/` that is not a campaign, and a host has no use for it: the
consumer who cares which engine built a campaign is a person reading history, and they are already
in the repository.

**Rejected — recording the engine commit inside the manifest.** The natural place, and it is
unavailable. The manifest's shape is the engine's published type, so adding a field is an engine
change, made in the engine repository, for one consumer's benefit. Raising it there is the correct
route if a host ever needs it; inventing a local variant of an engine-owned type here is the
consumer-stops-being-a-consumer failure §7 is about.

**Reversibility: cheap.** Nothing is written, so nothing has to be unwritten.

### 9. Corpus citations from code are left to the full audit, rejected for widening the checker

**Chosen:** campaign sources keep citing `03` by section, the citations are not machine-checked, and
their rot is the full-audit path's to catch — alongside the existing advice to append rather than
renumber.

**Rejected — widening the checker's read scope to include the campaign sources**, so its reference
check resolves `§` citations wherever they appear. It is the one mechanism that would catch this
class, and it is rejected on three counts, any one of which is sufficient. It closes the cycle the
combined graph is drawn to avoid, making the corpus's checker depend on the corpus's consumer. It
turns `Test-SpecSet.ps1`'s corpus scope — a fact its contract states and its tests assert — into two
roots instead of one, which is a contract amendment rather than a design preference. And it would
have the PowerShell checker parsing TypeScript comments, which is the restricted grammar's
fragility applied to a second language for a much smaller return.

**Rejected — dropping the citations and referring to sections by title.** Titles survive
renumbering, which is genuinely the failure this is about. Rejected because a title is not an
address: it does not survive a rename any better than a number survives a renumber, it cannot be
followed to a line, and it would blunt the only link that exists in either direction between a
campaign source and the specification it was transcribed from. Those citations are the most
valuable thing in those files for a reader, and making them less precise to make them less fragile
is a bad trade.

**Reversibility: cheap.** Both rejections remain available, and neither is foreclosed by leaving
the citations as comments.

## Open questions

Things that cannot be resolved without information the brief does not contain. Each is a genuine
fork, and each carries a recommendation.

**1. Does a change to a published campaign require its version to change?** The address a host
caches by is `(id, version)`, and the manifest's resolution digest is computed over those pairs, so
an edit that changes a campaign's content without changing its version is invisible to a host at
both levels — while the per-campaign digest, which does move, is not what a resolver keys on. The
options are: require a version bump on any content change and check it, which makes the address
honest and makes every edit a release; or declare the digest the identity and the version merely
descriptive, which costs nothing and means a host must compare digests to learn anything. This is a
compatibility promise to an external consumer, so this document may not settle it.
*Recommendation: require the bump and check it — the check is a comparison against the previous
commit's manifest, and it is cheap while there is exactly one campaign and no host yet fetching.*

**2. What condition lifts the seed campaign into the catalog?** The single campaign is hidden and
carries a notice saying it is a seed, which is right while most of its collections are empty.
Nothing says what makes it not a seed. The candidates are: `03` §16.1's content targets being met,
which is countable and already written down; a playability judgement, which is not checkable but is
what actually matters; or a completed scenario run, which is the strongest evidence and the most
expensive to produce. *Recommendation: §16.1's targets as the necessary condition and a playability
judgement as the sufficient one — so the flag cannot flip early by accident, and cannot flip merely
because a count was reached.*

**3. Is the second game's content in scope for this repository?** `docs/docs/games/` carries the
spec for `bulgaria-adventure.md`, a `story-graph` game, and the shared Bulgarian source scenes both
games draw on. The 2026-08-30 ownership decision reasoned only about Life in the Fast Lane, and its
argument — that a spec set and its content are one artifact seen twice — applies just as well to
Game 2's spec, which is also here. Against that: the ecosystem already has
`SubZeroDev.Adventures.Content` owning story-graph campaigns, and the exporter names one kind
today, though the catalog and the manifest are plural and would carry a second campaign without
complaint. The answer changes what the exporter's kind handling must become, and whether the shared
Bulgarian scenes have a home in this tree. *Recommendation: keep Game 2's content out, and record
that as a decision rather than leaving it implied by absence — the ownership decision's reasoning
was about the flagship, and the brief says this repository holds Life in the Fast Lane "and nothing
else".*

## Settled questions

These needed information the brief did not contain, and each was a real fork rather than a request
for confirmation. **All six have been decided.** Each question is kept because the fork it names is
what a later reader needs in order to understand why the answer is what it is; the answer follows
each one, and the entry named there carries the rejected alternatives.

**1. What counts as a "concept" for the fourth condition?** The brief requires every concept to
have a stated lifecycle. The narrow reading is state-bearing entities — the things `04` holds in
game state, for which `04` §5.4.1 already provides a worked lifecycle in the exact required form
("Generation… three paths"; "Resolution… exactly one way"). The broad reading includes mechanisms
that bear no state — the eviction ladder, promotion, the check formula. The narrow set is
enumerable from the index and is perhaps a few dozen; the broad set is a reading of the whole
corpus and is not enumerable mechanically at all. This changes both the scope of the work and
whether the condition is checkable. *Recommendation: the narrow reading, with the broad set handled
on the full-audit path.*

**Answered — the narrow reading.** `90-decisions.md` (2026-08-20, *A concept is a state-bearing
entity*). Stateless mechanisms are outside the derived concept set and go to the full-audit path;
`20-contract.md` § *Authored records* carries the binding wording.

**2. Should this repository have CI?** It had none, and Alternative 5 declined to create one as a
side effect. If the answer is yes, the checker is its first job and the question is whether a
finding fails the build or merely reports.

**Answered — yes, and a finding fails the build.** `90-decisions.md` (2026-08-20, *The checker is a
CI gate, and a finding fails the build*). The verification workflow carries the checker, the Pester
suite, and — since the content path landed — the content gate; exit 1 and exit 2 both fail the step.

**3. Is SubZeroDev.GameEngine checked out beside this repository, and may the checker read it?**
It changes cross-repository references from permanently unchecked to resolvable, which is the
difference between a whole class of reference being verified and being taken on trust. It also
makes the checker's behaviour depend on a second working copy, which is a cost.

**Answered — no, and permanently.** `90-decisions.md` (2026-08-20, *No `-EnginePath`*). There is no
parameter and adding one is a contract amendment (SS9). Cross-repository references are reported
*unresolvable* — never passed, never broken — and `SpecReference.PinnedSha` is the guarantee
carried instead. The later SS5 split (2026-08-23) made that category stop failing the build without
reopening the parameter.

**The engine submodule does not reopen this.** It is a checkout of the same repository sitting
inside this one, which is materially what the question asked about — and the answer is unchanged,
because the two relationships are different. System 2 compiles against the pin; system 1 still may
not read it. Letting the checker resolve corpus references through the submodule would make a
documentation guarantee depend on a dependency's checkout state, and would silently re-answer a
decision that was made on its merits. The distinction is drawn in *Module boundaries* → *External
boundaries*.

**4. The provisional register disagrees with itself, and I cannot tell which side is right.**
`04` §22.2 lists six deferred items. `AGENTS.md` names four; `agent.md` names five, adding travel
costs, which §22.2 does not list. The word "provisional" appears at only two of the sites. So there
is no agreed population, and the brief's third condition ranges over a set nobody has written down.
Additionally, §22.2's rows carry a reason but not always a settling condition — "Pure balance;
expect it to change" is a reason with no condition, where "Tune once job availability exists" is
both. Which rows are authoritative, and does every row need a condition or only a reason? *This is
a decision, and it is the one that most blocks the third condition from being checkable at all.*

**Answered — §22.2 is authoritative and every row carries both.** `90-decisions.md` (2026-08-20,
*`04` §22.2 is the sole provisional register*): the lists in `AGENTS.md` and `agent.md` became
pointers, the free-text column split into `Reason` and `Settles when`, and SS13/SS14 hold it. The
one row that had a reason and no condition was settled by asking rather than by inventing one —
`90-decisions.md` (2026-08-22, *housing quality settling condition*).

**5. Is tooling in scope for this repository?** The brief's non-goals exclude engine source,
hosting, and base-image changes — not tooling — and the repository already carries a substantial
PowerShell tool set with Pester tests. But the brief's environment says "no runtime", and this
design's central mechanism is a program. I have read the exclusion as not applying, on the grounds
that "no runtime" describes the absence of a game or server rather than a prohibition on scripts,
and that `AGENTS.md` explicitly classifies counting and set arithmetic over files as work that
should leave the model entirely. **If that reading is wrong, most of this design is out of scope**
and the answer is a documented full-read discipline instead — in which case say so, because the
data model and the module boundaries both fall with it.

**Answered — the reading was right; tooling is in scope.** `90-decisions.md` (2026-08-20, *Tooling
is in scope; the checker is PowerShell in `tools/`*). Nothing here falls. The brief has since gone
further in the same direction: it describes two toolchains, and "no runtime" is stated as a
property of what this repository *serves* rather than of what it runs.

**6. What is the enforcement standing of the reduction in Alternative 4?** Deleting restatements
from `03` improves the corpus and shrinks the checkable surface, but it is an edit to a design
document with its own voice and audience, and it is expensive to reverse. Whether that reduction is
a licence to apply per-site during implementation, or a separate reviewed pass, is a scope decision
I should not take by default.

**Answered — per-site, and never by growing `03` to make a site obligable.** `90-decisions.md`
(2026-08-20, *Reduce the mirrored surface*) chose the reduction; the standing was settled by
`90-decisions.md` (2026-08-23, *A mirror obligation is all-or-nothing*) and is stated in
`20-contract.md` § *Authored records*: a site that describes only part of a declaration is reduced
per the 2026-08-20 decision **or** left to the full-audit path. Editing `03` to restate more of
`04` is that decision's rejected direction, so the reduction is applied per-site and the
alternative is the full read, not a bigger mirror.
