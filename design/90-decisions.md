# Decision log

Append-only. Newest at the top. The rejected alternatives are the point — without them, every future session relitigates the same choice.

## Open
<A staging area, not a home. Things noticed mid-slice that were deliberately not acted on. `/track` turns each into a GitHub issue and removes it from here. An item that is a *decision* rather than a *todo* belongs below as an entry, not in an issue.>

---

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
