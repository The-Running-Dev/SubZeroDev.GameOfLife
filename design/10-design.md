# Design — Life in the Fast Lane (spec set)

Derived from [`00-brief.md`](00-brief.md). The system designed here is **the spec set and the
machinery that holds its invariants** — not the game, and not the engine. The game's design is
`docs/docs/games/03-game-design.md`; the engine's is `04-engine-specification.md`. This document
is about keeping those two, and their four companions, true.

The brief's four completion conditions are invariants over a 177 KB corpus, and the brief states
why they survive unmet: each is "only discoverable by reading the whole set at once". That is the
whole design problem. A rule whose only enforcement is an expensive full read is enforced at
whatever rate full reads actually happen, which the repository's own history shows is lower than
the edit rate.

## Data model

The corpus is the only persisted state. Everything the checker knows is **derived on each run and
discarded**; nothing is cached, mirrored into a sidecar, or written back. That is the first and
most consequential decision here, and *Alternatives considered* §1 records what it rejected.

Records fall into two ownerships, and the split is the load-bearing part of the model.

### Derived records — extracted, never authored

Recomputed from the markdown on every run. They have no independent existence, so they cannot
drift from the corpus by construction.

| Record | Identity | Extracted from | Notes |
|---|---|---|---|
| **Document** | Repo-relative path | The corpus directory | Ordering position comes from the numeric filename prefix; see *Failure modes* on renumbering |
| **Declaration** | Qualified name (`AttributeState.wisdom`) | TypeScript fences in `04` | 172 today. Fields, type aliases, and union members each get their own identity |
| **Closure** | — | The declaration's own form | A derived boolean, defined below. The single most important derived value in the model |
| **Reference** | Source document + target | `§N.N` spans and inter-document links | 107 section references and 36 document links today |
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

### Authored records — declared in the prose

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

### Why the mirror obligation is authored rather than inferred

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

### The precedent already in the corpus

`03` §3.4 is the model, and it was not designed here — it is what the repository already did. It
once carried the attribute list and drifted from it. It now states only the rule attributes obey
and holds no list at all; `04` holds the shape. The duplication was removed rather than
synchronised, and the defect class went with it.

§3.5, three lines below it, still carries its list. The difference is not inconsistency: skills are
open and attributes are closed, so §3.5's list is content and §3.4's list was a second copy. The
corpus is already right on both counts. The design's job is to make that distinction checkable
instead of incidental.

## Module boundaries

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

### External boundaries

Three, and each is a place this repository's guarantees stop.

- **Docusaurus and the base image.** Consumes the corpus, one way. Decoupled from the checker
  entirely: the check runs without Docker, and the site builds without the checker. `agent.md`
  records the base image's contents as assumed rather than verified, which is why nothing here
  depends on it.
- **SubZeroDev.GameEngine.** The consumer, and the only judge of the brief's first condition. The
  corpus names it; it cannot be read from here without a checkout.
- **GitHub.** Tracking only. No invariant depends on it.

## Control flow

Three paths, and they run at three different rates. The design's purpose is to move work from the
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
lifecycle statement is true rather than merely present, whether a settling condition is real.

This path is **not** replaced by path 1, and the design fails if it is treated as replaced. Path 1
retires the mechanical half — the counting and set arithmetic that `AGENTS.md` classifies as work
that should leave the model entirely — so that the full read spends its attention on meaning. The
`wisdom` defect was findable by counting. Whether `03` §3.4's remaining rule is the *right* rule
was never findable that way.

### 3. Downstream question — triggered by GameEngine failing to implement

The outer loop, and the brief's first condition: the engine repository implements the first
playable scope and either does so without a clarifying question or does not. The brief settles how
this is judged — "by attempting it, not by review" — so the trigger is an implementation attempt,
and the signal is a question that could not be answered from the documents.

Each such question is a defect in the corpus, regardless of how reasonable it was to ask. It
returns as a tracker issue and is fixed here. This is the only path that can detect meaning that is
absent rather than inconsistent, and no amount of local checking substitutes for it.

## Failure modes

### The index cannot parse something

A TypeScript fence the restricted grammar does not accept, a marked region that is unclosed or
mismatched, or a document that is unreadable.

**The extractor fails loudly and never guesses.** This is the decision that makes a restricted
parser safe to rely on: the danger in pattern-matching a language is not that it fails, it is that
it silently matches less than it should and reports the shortfall as a clean run. A declaration the
index skipped is a declaration no check examined, and the report would say the corpus is clean.

Detected at extraction. The run stops, reports the file and line, exits 2. The author sees which
construct was not understood. State left behind: none. Nothing partial is reported as complete.

### A check finds a genuine defect

An obligated declaration whose fields `03` no longer mirrors; a provisional entry missing its
reason or its settling condition; a provisional site whose register row does not exist, or a row no
site points at; a concept with no lifecycle; a reference resolving to nothing.

Reported as a finding, exit 1. Which side is wrong is not the checker's call — an unmirrored pair
means `03` and `04` disagree, and either could be the stale one. The check establishes that they
disagree and stops there, per the repository's standing rule that drift is reported and neither
side changed.

### Partial failure — some checks ran, one could not

**Status 2 takes precedence over 1**, following the convention the repository's existing tooling
already sets. A run that found drift *and* failed to complete a comparison is an incomplete run,
and reporting it as a finished one is the fabricated-gate-result failure the repository's
*Verification* rules exist to prevent. The report names what did not run, always, and that list is
the part that matters.

### A cross-repository reference cannot be resolved

The corpus names engine documents that live in SubZeroDev.GameEngine. Without a checkout beside
this repository, those references cannot be resolved.

**They are reported as unchecked, never as passed, and never as broken.** Absent evidence is not
evidence of either. An unresolvable cross-repository reference contributes to the did-not-run list
and to status 2, not to the findings list. Silently treating them as fine is how a whole class of
reference rots unnoticed; treating them as broken would make the check unusable without a second
checkout and would train the author to ignore it.

### Docker or the base image is unavailable

The site does not build. The checker is unaffected, by the decoupling above. No invariant in the
brief depends on the site rendering, and the failure is visible immediately and locally.

### A document is renumbered or inserted

The corpus's ordering is positional, so an insertion renumbers every later document and invalidates
every link and section reference into them. `agent.md` records this and advises appending.

The reference check detects the aftermath — dangling links and unresolvable section references —
but detects it *after* the renumbering, as breakage. It cannot make the operation safe, only loud.
That is a real and accepted limitation: a rename-aware migration would need the checker to write to
the corpus, which the module boundaries forbid for a stronger reason than this one is worth.

### Retry semantics

None, anywhere. Every path is a local, deterministic, read-only pass over files on disk. There is
nothing to retry, no partial write to roll back, and no state left behind by a failed run. A run
that fails leaves the corpus byte-identical to how it found it.

## Concurrency and ordering

**Nothing in this system is concurrent, and the checks are order-independent.**

What enforces it: the repository has a single author and no runtime, no server, and no process that
outlives a command. The checker is a batch pass with no shared mutable state — checks depend only
on the index, never on each other, so they may run in any order or none, and the report is a pure
function of the record set. There is no scheduling to get wrong because there is nothing to
schedule.

Two ordering hazards survive that, and neither is concurrency in the runtime sense. Both are real.

**The working tree moves under the run.** A check runs against whatever is on disk, which during an
editing session is a mixture of saved and unsaved state. A finding from such a run describes a
corpus that may never have been committed. Enforcement: the report **names the commit it ran
against and whether the tree was clean**. A run against a dirty tree is a useful local signal and
is not an authoritative result, and the report must be able to tell the two apart rather than
leaving the author to remember which it was.

**The two repositories advance independently.** This is the genuine version of the problem: this
corpus and SubZeroDev.GameEngine have separate histories, no shared lock, and each references the
other. A statement here about the engine's contracts is true as of some commit of a repository this
one does not contain, and it can be falsified by a push nobody here observes.

Nothing can prevent that, and the design does not pretend to. What it does is make a claim
checkable rather than merely asserted: a cross-repository reference **pins the commit it was true
at**, following the pinning convention this repository already uses for design references. An
unpinned cross-repository claim is unfalsifiable, and unfalsifiable claims in a specification are
how the engine ends up implementing against something that stopped being true.

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
would decide exactly, where a restricted grammar decides it for the forms it knows. The rejection is
not on correctness but on cost of ownership: it introduces a Node runtime and a package tree into a
repository whose entire toolchain is PowerShell Core and which the brief describes as
offline-capable with no runtime. That is a new dependency in the sense this repository requires a
logged decision for, and it is a standing one — a version to maintain, a lockfile to audit, and an
install step between an author and a check for years.

The deciding argument is that the restricted grammar's failure mode is *acceptable because it was
designed to be*. It never guesses; an unrecognised construct stops the run. So the grammar's
coverage gap is visible, loud, and located, rather than silent. A parser that fails safely and
covers 95% is worth more than one that covers 100% and costs a runtime.

**The condition that reverses this:** if the corpus's declaration forms outgrow the grammar often
enough that status-2 stops meaning "look at this" and starts meaning "run it again", the tradeoff
has inverted and the real parser is correct. That is a countable condition, not a matter of taste.

**Reversibility: cheap.** The index is one module behind a record-set boundary, and swapping its
internals changes nothing else.

### 3. Declared mirror obligations, rejected for inferred ones

**Chosen:** `03` names the closed declarations it holds prose for; the check is set arithmetic over
those ids.

**Rejected:** inferring the obligation by scanning `03` for identifier mentions, so nothing needs
authoring.

Inference needs no markers and covers the corpus from the first run, which is genuinely attractive.
It is rejected because "mentions" and "describes" are different relations and only the second is the
brief's condition. Inference would flag `03` §3.5's twelve skills forever — they are content
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

**Rejected — CI:** the repository has no CI at all today, so this would introduce a workflow, a
runner, and a green/red signal as a side effect of a checker decision. Whether this repository has
CI is a policy question that outranks this design, and it is raised in *Open questions* rather than
settled by implication.

**Reversibility: cheap** in both directions; the check is a command, and what invokes it is a
separate choice.

## Open questions

These need information the brief does not contain. Each is a real fork, not a request for
confirmation.

**1. What counts as a "concept" for the fourth condition?** The brief requires every concept to
have a stated lifecycle. The narrow reading is state-bearing entities — the things `04` holds in
game state, for which `04` §5.4.1 already provides a worked lifecycle in the exact required form
("Generation… three paths"; "Resolution… exactly one way"). The broad reading includes mechanisms
that bear no state — the eviction ladder, promotion, the check formula. The narrow set is
enumerable from the index and is perhaps a few dozen; the broad set is a reading of the whole
corpus and is not enumerable mechanically at all. This changes both the scope of the work and
whether the condition is checkable. *Recommendation: the narrow reading, with the broad set handled
on the full-audit path.*

**2. Should this repository have CI?** It has none. Alternative 5 declined to create one as a
side effect. If the answer is yes, the checker is its first job and the question is whether a
finding fails the build or merely reports.

**3. Is SubZeroDev.GameEngine checked out beside this repository, and may the checker read it?**
It changes cross-repository references from permanently unchecked to resolvable, which is the
difference between a whole class of reference being verified and being taken on trust. It also
makes the checker's behaviour depend on a second working copy, which is a cost.

**4. The provisional register disagrees with itself, and I cannot tell which side is right.**
`04` §22.2 lists six deferred items. `AGENTS.md` names four; `agent.md` names five, adding travel
costs, which §22.2 does not list. The word "provisional" appears at only two of the sites. So there
is no agreed population, and the brief's third condition ranges over a set nobody has written down.
Additionally, §22.2's rows carry a reason but not always a settling condition — "Pure balance;
expect it to change" is a reason with no condition, where "Tune once job availability exists" is
both. Which rows are authoritative, and does every row need a condition or only a reason? *This is
a decision, and it is the one that most blocks the third condition from being checkable at all.*

**5. Is tooling in scope for this repository?** The brief's non-goals exclude engine source,
hosting, and base-image changes — not tooling — and the repository already carries a substantial
PowerShell tool set with Pester tests. But the brief's environment says "no runtime", and this
design's central mechanism is a program. I have read the exclusion as not applying, on the grounds
that "no runtime" describes the absence of a game or server rather than a prohibition on scripts,
and that `AGENTS.md` explicitly classifies counting and set arithmetic over files as work that
should leave the model entirely. **If that reading is wrong, most of this design is out of scope**
and the answer is a documented full-read discipline instead — in which case say so, because the
data model and the module boundaries both fall with it.

**6. What is the enforcement standing of the reduction in Alternative 4?** Deleting restatements
from `03` improves the corpus and shrinks the checkable surface, but it is an edit to a design
document with its own voice and audience, and it is expensive to reverse. Whether that reduction is
a licence to apply per-site during implementation, or a separate reviewed pass, is a scope decision
I should not take by default.
