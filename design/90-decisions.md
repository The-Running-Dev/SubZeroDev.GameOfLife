# Decision log

Append-only. Newest at the top. The rejected alternatives are the point — without them, every future session relitigates the same choice.

## Open
<A staging area, not a home. Things noticed mid-slice that were deliberately not acted on. `/track` turns each into a GitHub issue and removes it from here. An item that is a *decision* rather than a *todo* belongs below as an entry, not in an issue.>

---

### 2026-08-20 — No `-EnginePath`; cross-repository references are permanently unchecked
Context: `10-design.md` § *Open questions* 3, the last signature `20-contract.md` left open. SS9 already fixed the semantics — a reference into SubZeroDev.GameEngine is unchecked, never passed, never broken — so the only question was whether a parameter exists to resolve them against a checkout sitting beside this repository. A public interface, so not a slice's to add later without an amendment.
Chosen: No parameter. `Read-SpecSetIndex` takes `-CorpusPath` only. Cross-repository references contribute to the did-not-run list and status 2, permanently, and `SpecReference.PinnedSha` (SS17) is the whole guarantee they carry.
Rejected: Adding `-EnginePath` and treating a pin that is not an ancestor of the checkout's HEAD as unchecked — verifies a class of reference currently taken on trust, and mirrors the ancestry check `Test-DesignDrift.ps1` already performs, but makes the checker's result depend on a second working copy's state, so two authors get different answers on the same commit. Also rejected: the same, but treating a stale pin as a finding — the strongest guarantee against the corpus asserting something that stopped being true, and the one whose findings depend on how recently someone pulled the other repository, which is exactly what trains people to ignore a check.
Reversibility: cheap in mechanism, ceremonious by design — adding the parameter is a contract amendment, which is the point.

### 2026-08-20 — Tooling is in scope; the checker is PowerShell in `tools/`
Context: `10-design.md` § *Open questions* 5. The brief's environment says "no runtime", and this design's central mechanism is a program. If the exclusion applied, the data model and the module boundaries both fell with it and the answer became a documented full-read discipline instead.
Chosen: In scope. The brief's non-goals name exactly three things — engine source, hosting, base-image changes — and tooling is not among them; `tools/` already carries 27 PowerShell files with Pester tests beside them; `AGENTS.md` § *What should stop being model work* classifies counting and set arithmetic over files as red, belonging in code. "No runtime" is read as describing the absence of a game or server, not a prohibition on scripts.
Rejected: Out of scope, with a documented full-read discipline replacing the checker — honest to the strictest reading of the environment section, but it leaves the brief's conditions enforced at whatever rate full reads happen, which is the rate the brief is complaining about. Also rejected: markers now, checker later — gets the authored records in place but leaves the invariants unenforced meanwhile, which is the current state with extra syntax.
Reversibility: expensive — most of `10-design.md` is predicated on it.

### 2026-08-20 — `04` §22.2 is the sole provisional register, and every row carries a settling condition
Context: `10-design.md` § *Open questions* 4. Three documents disagree about the population: `04` §22.2 lists six items, `AGENTS.md` names four, `agent.md` names five and adds travel costs. The brief's third condition ranges over a set nobody had written down. Separately, §22.2's rows carry a reason but not always a condition — "Pure balance; expect it to change" is a reason with no condition.
Chosen: §22.2 is authoritative and is the only register. The lists in `AGENTS.md` and `agent.md` become pointers to it. Every row must carry both a reason and a checkable settling condition; a row with only a reason is a finding, because the brief asks for "the condition that would settle it" in as many words. Recorded as SS13 and SS14. The table's `Why it may need revisiting` column splits into `Reason` and `Settles when`, so the check is "the cell is non-empty" rather than a judgement about whether a sentence contains a condition — the latter is prose reading, which this system is not permitted to do. Consequence, accepted deliberately: the `§8.7 Housing quality` row ("Pure balance; expect it to change") has no condition to migrate and is a finding on the first run.
Rejected: Reason required, condition optional — permits a number deferred with nothing that would ever settle it, and leaves the check unable to distinguish deliberate indefinite deferral from an unfinished row. Also rejected: reconciling all three lists item by item before fixing the register's shape — more rigorous, and it blocks the contract on a separate pass over three documents when the shape decision does not depend on the outcome.
Reversibility: cheap for the condition requirement; the two pointer edits are a deletion each.

### 2026-08-20 — A concept is a state-bearing entity
Context: `10-design.md` § *Open questions* 1. The brief's fourth condition requires every concept to have a stated lifecycle, and "concept" was undefined. The narrow reading is what `04` holds in game state; the broad reading adds stateless mechanisms — the eviction ladder, promotion, the check formula.
Chosen: Narrow. The set is enumerable from the index, and `04` §5.4.1 already provides the worked form. Stateless mechanisms are judged on the full-audit path.
Rejected: The broad reading — closer to the literal brief, but the broad set is not enumerable mechanically, so the check degrades to "is there a marker" with no way to know what is missing, and the completeness gap already admitted for mirror obligations gets much larger. Also rejected: narrow plus a hand-marked opt-in for stateless mechanisms — stops the broad set being all-or-nothing, at the cost of more authored surface and a second judgement call per mechanism.
Reversibility: cheap — markers are additive and inert.

### 2026-08-20 — The checker is a CI gate, and a finding fails the build
Context: `10-design.md` § *Open questions* 2, and a premise the design got wrong. Alternative 5 chose "a gate the repository's verification command discovers and runs", but `/verify` discovers a gate only from a `# verification: true` comment in `.github/workflows/*.yml`, and this repository has no `workflows/` directory at all. Without one the checker lands in `/verify`'s optional "worth running if run" bucket and is not a discovered gate.
Chosen: Create `.github/workflows/verify.yml` with two flagged steps — the checker, and the Pester suite over `tools/`. Exit 1 and exit 2 both fail the step, matching how `Test-Companion.ps1` and `Test-DesignState.ps1` already behave. This makes Alternative 5's choice true rather than aspirational.
Rejected: No CI, a manually invoked script only — cheapest and honest about the repository having none, but the check's enforcement rate stays exactly as voluntary as the full read it is replacing. Also rejected: CI that reports without failing — a non-blocking signal beside a red/green one is the one people learn to scroll past. Also still rejected, unchanged from Alternative 5: a pre-commit hook, which blocks legitimately mid-edit commits on a corpus-wide invariant.
Reversibility: cheap — deleting the workflow returns the checker to a manually invoked script.

### 2026-08-20 — Marker vocabulary: four declared id forms, visible bodies, one corpus-wide namespace
Context: `10-design.md` fixed the four authored records and reused `AGENTS.md` § *Marked regions*' declared form, but named no ids and did not say what a region's body contains. The checker cannot be specified without both.
Chosen: `mirror-<QualifiedName>` in `03`, `provisional-register` once corpus-wide in `04` §22.2, `provisional-site-<Key>` at each number, `lifecycle-<ConceptName>` where the concept is introduced. Ids are unique across the corpus, sharing one namespace with any projected region. A region's body is the visible prose that was going to be there anyway — the marked span of `03`'s description, the existing register table, the sentence carrying the number, the lifecycle paragraph — so only the two markers are comments.
Rejected: Hidden bodies carrying machine-readable data inside the comments — parses more easily and needs no judgement about what prose counts, but a body a reader has no use for is a sidecar wearing a marker, and it breaks the one-way dependency that lets the checker be deleted without orphaning anything. Also rejected: one region per document listing its obligations, rather than one per obligation wrapping the prose — simpler to author, but it decouples the obligation from the sentences that discharge it, so the check could no longer see whether a member is actually described.
Reversibility: cheap — markers are additive and inert.

### 2026-08-20 — Two files, with the module boundaries enforced by AST inspection
Context: `10-design.md` names five modules with an acyclic one-way dependency graph and requires the Index to contain every regular expression in the system. PowerShell has no module boundary the language enforces, so the claim is either checkable or decorative.
Chosen: `tools/Read-SpecSet.ps1` holds Corpus access and Index; `tools/Test-SpecSet.ps1` holds Checks, Report and Runner and dot-sources the reader. This matches the repository's existing `Read-DesignState.ps1` / `Test-DesignState.ps1` split for the same shape. SS2, SS3 and SS4 are then enforced by parsing the scripts with `[System.Management.Automation.Language.Parser]` — the same mechanism the kit's CI recipe already uses for its parse-check — and asserting no match operator outside the reader and no file cmdlet inside a check function.
Rejected: Five separate files, one per module — closer to the design's diagram, but Corpus is the markdown rather than code and Report and Runner are a few functions each, so three of the five files would exist only to look like the diagram. Also rejected: one file with naming conventions for the boundaries — matches `Test-DesignState.ps1`'s single-file shape, but a convention no test reads is exactly the "enforced by instruction" category SS2 was supposed to escape.
Reversibility: cheap — splitting or merging PowerShell files behind the same function names changes no caller.

### 2026-08-20 — Typed classes for the records, `[pscustomobject]` for the result envelope
Context: `/contract` requires explicit nullability and forbids untyped dictionaries, and `[pscustomobject]@{}` is an untyped dictionary by construction. But `/verify` already consumes a `[pscustomobject]` with `State` and `Detail` from `Test-Companion.ps1` and `Test-DesignState.ps1`.
Chosen: PowerShell 7 `class` declarations for the nine record types, and `[pscustomobject]` for the single result object the entry point emits. Internal records are typed; the external shape matches the consumer that already exists.
Rejected: `[pscustomobject]` throughout, matching all 27 existing tools — one less style in the repository, but nine record types with no declared field set is precisely where a field silently appearing or disappearing goes unnoticed, which is the defect class this project is about. Also rejected: classes throughout, including the result — would force a change in `/verify` or an adapter, for no gain.
Reversibility: cheap — the classes are internal to two files.

### 2026-08-20 — Spec-set invariants derived from the prose, not from a sidecar
Context: `/design` for the spec set. The brief's completion conditions are invariants over a 177 KB corpus that only a whole-set read can currently check. Any mechanical check needs the corpus's types, numbers and concepts in a form it can compute over.
Chosen: Derive every mechanical record (declarations, closure, references) from the markdown on each run and persist none of it. Judgement that cannot be computed — mirror obligations, the provisional register, the concept set — is authored as declared marked regions inside the document it describes, using the marker mechanism `AGENTS.md` § *Marked regions* already defines.
Rejected: A YAML/JSON sidecar enumerating types, fields and provisional numbers. Trivially parseable and needs no grammar, but it is a second copy of `04`'s declarations — the exact defect class the brief exists to eliminate, and worse than the current one, because the checker would report the corpus clean from the stale copy while the prose disagreed. Also rejected: a new marker syntax, when the repository already has one.
Reversibility: expensive — a sidecar, once written, becomes an input everything else assumes.

### 2026-08-20 — Restricted grammar that fails loudly, not a TypeScript parser
Context: Extracting `04`'s 172 declarations, and in particular deciding *closure* (fixed membership vs content-supplied), requires parsing TypeScript out of fenced blocks. The repository's toolchain is PowerShell Core throughout and the brief describes it as offline-capable with no runtime.
Chosen: A restricted grammar accepting the declaration forms the corpus actually uses, which exits 2 on anything it does not recognise. Never guesses, never partially matches. The coverage gap is loud and located rather than silent.
Rejected: Parsing the fences with the real TypeScript compiler via Node. Strictly more correct — closure is a syntactic property it would decide exactly — but it introduces a Node runtime, a package tree and a lockfile into a docs repository, standing for years, as a new dependency. The deciding argument is that a parser failing safely at 95% coverage beats one covering 100% at the cost of a runtime.
Reversibility: cheap — extraction is one module behind a record-set boundary. Reverses when unrecognised forms become frequent enough that status 2 stops meaning "look at this".

### 2026-08-20 — Mirror obligations declared, not inferred from prose
Context: The brief's second condition is conditional — every declaration in `04` *that `03` describes in prose*. Nothing can compute "describes"; mentioning, contrasting and describing are indistinguishable to a parser.
Chosen: `03` declares which closed declarations it holds prose for. The check becomes set arithmetic over ids, matching the repository's existing rule that drift is compared on ids and never on prose. The stated limit: the checker proves declared obligations hold and cannot prove the obligation set is complete — that stays a full-read judgement.
Rejected: Inferring obligations by scanning `03` for identifier mentions. Needs no markers and covers the corpus immediately, but would flag `03` §3.5's twelve skills forever — content against an open registry, and correct as it stands — while a passing mention would manufacture obligations nobody intended. A report that is mostly false positives is not read.
Reversibility: cheap — markers are additive and inert.

### 2026-08-20 — Closure distinguishes a mirror obligation from content
Context: `03` §3.4 once listed attributes and drifted (the `wisdom` defect); it now states only the rule and holds no list. `03` §3.5, three lines away, still lists twelve skills — but `04` holds skills as a keyed map naming none, so that list is content, not a restatement. The two look identical to a naive checker and are opposite cases.
Chosen: Derive *closure* per declaration — fixed membership (interface, literal union, enum) versus content-supplied membership (keyed map or record). Only closed declarations can carry a mirror obligation. Closure is derived from the declaration's form, never declared.
Rejected: A hand-maintained closed/open flag — the second copy this design exists to avoid. Also rejected: ignoring the distinction, which reports §3.5 as a defect on every run.
Reversibility: cheap.

### 2026-08-20 — Reduce the mirrored surface rather than mirror everything
Context: The maximal reading of the brief's second condition obligates every closed declaration `03` mentions. `03` §3.4 demonstrates the alternative: the restatement was deleted and the rule kept, so nothing about attributes can go stale in `03` any more.
Chosen: Treat §3.4 as the pattern. Where `03` restates a closed declaration's shape, prefer deleting the restatement and keeping the rule; obligate and check only what genuinely must be described in both. Reduce the mirror, do not eliminate it.
Rejected: Obligating everything — maximises the surface that can drift in order to check it, when the pair that cannot diverge is the one that exists once. Also rejected: pure single-ownership with no mirror at all — `03` is a design document written to be read, and prose that names nothing concrete is unusable as design.
Reversibility: expensive — deleting prose from `03` and reconstructing it later is a rewrite, and the deleted version exists only in history.

### 2026-08-20 — The checker is read-only, and a verification gate rather than a hook or CI
Context: A checker that could fix what it finds would be a generator over the design documents, which is the loop `AGENTS.md` § *The design freeze* exists to escape. Separately, the check needs an invocation point, and the repository has no CI at all.
Chosen: No module writes to the corpus, and none may gain that power later — checking must be a fixed point, and fixing is a person's decision and an editing command's job. The check is a gate the repository's verification command discovers and runs, invoked deliberately. Status 2 takes precedence over 1, matching the existing tooling.
Rejected: A pre-commit hook — right moment, but it blocks legitimately mid-edit work-in-progress commits on a corpus-wide invariant, and the predictable outcome is a habit of bypassing it. CI — would introduce a workflow, a runner and a green/red signal as a side effect of a checker decision, when whether this repository has CI is a policy question that outranks this design; raised as an open question instead.
Reversibility: cheap in both directions — the check is a command, and what invokes it is a separate choice.

### 2026-08-20 — AGENTS.md/CLAUDE.md direction on kit install
Context: First install of SubZeroDev.AgentKit. `CLAUDE.md` already held this repo's real content (project identity, doc-set map, tooling); `AGENTS.md` didn't exist. The kit's default is AGENTS.md-holds-content, CLAUDE.md-as-pointer — the opposite of how this repo already had it.
Chosen: Flip to the kit's default. Moved CLAUDE.md's existing content into a new AGENTS.md, merged the kit's contract sections in (target's content first, under "Project identity", then the kit's sections verbatim), reduced CLAUDE.md to a one-line `@AGENTS.md` pointer.
Rejected: Keeping CLAUDE.md as the content file and making AGENTS.md the pointer — smaller diff, but the user explicitly chose the bigger move to match the kit's own arrangement.
Reversibility: cheap — the content is unchanged, only which file holds it.

### 2026-08-20 — House conventions path on kit install
Context: The kit's AGENTS.md House Conventions section states a machine/path convention specific to the kit repo itself (Windows, `D:\Dropbox\Projects\`). This repo runs on a Mac at `/Users/ben/Dropbox/Projects/`, but does use PowerShell Core for scripts (`docs.ps1`), so the section wasn't entirely inapplicable.
Chosen: Adapt the line to this repo's actual environment (Mac, `/Users/ben/Dropbox/Projects/`) rather than dropping the whole section. Kept PowerShell-for-scripts, UTF-8/LF, raster-assets, and commit-message conventions verbatim since they're project-independent and already true here.
Rejected: Dropping the House Conventions section entirely — would have discarded conventions (UTF-8/LF, no-AI-attribution commits) that already apply here and aren't stated anywhere else in the repo.
Reversibility: cheap — one line.

### 2026-08-20 — Measure-Session.ps1 hooks on kit install
Context: `.claude/settings.json` didn't exist yet, and `pwsh` is on PATH — the install's one carved-out exception to "never touch settings.json" (installing `Measure-Session.ps1` as the `SessionEnd` and `UserPromptSubmit` hooks) was eligible.
Chosen: Install both hooks. Created `.claude/settings.json` containing only `hooks.SessionEnd` and `hooks.UserPromptSubmit`, matching the kit's own settings.json verbatim (repo has no `permissions`/`model` keys to protect).
Rejected: Skipping the hooks and installing `tools/Measure-Session.ps1` unwired — would have left the script present but session-cost tracking silently off.
Reversibility: cheap — delete the two hook keys.
