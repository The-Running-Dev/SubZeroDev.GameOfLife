# Decision log

Append-only. Newest at the top. The rejected alternatives are the point — without them, every future session relitigates the same choice.

## Open
<A staging area, not a home. Things noticed mid-slice that were deliberately not acted on. `/track` turns each into a GitHub issue and removes it from here. An item that is a *decision* rather than a *todo* belongs below as an entry, not in an issue.>

---

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
